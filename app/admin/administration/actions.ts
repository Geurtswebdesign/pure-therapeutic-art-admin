"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth/getAdminUser";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getDeletedCreditPackIds,
  markCreditPackDeleted,
} from "@/lib/credits/deletedPacks";

type CreditPackInput = {
  slug: string;
  name: string;
  credit_scope: "assignment" | "book" | "game" | "referral";
  credits_base: number;
  bonus_credits: number;
  price_cents: number;
  currency: string;
  sort_order: number;
  is_active: boolean;
};

function assertPackInput(input: CreditPackInput) {
  if (!input.slug.trim()) throw new Error("Slug is verplicht");
  if (!input.name.trim()) throw new Error("Naam is verplicht");
  if (!["assignment", "book", "game", "referral"].includes(input.credit_scope)) {
    throw new Error("credit_scope is ongeldig");
  }
  if (!Number.isInteger(input.credits_base) || input.credits_base <= 0) {
    throw new Error("credits_base moet een positief geheel getal zijn");
  }
  if (!Number.isInteger(input.bonus_credits) || input.bonus_credits < 0) {
    throw new Error("bonus_credits moet 0 of hoger zijn");
  }
  if (!Number.isInteger(input.price_cents) || input.price_cents < 0) {
    throw new Error("price_cents moet 0 of hoger zijn");
  }
  if (!input.currency.trim()) throw new Error("Currency is verplicht");
  if (!Number.isInteger(input.sort_order)) {
    throw new Error("sort_order moet een geheel getal zijn");
  }
}

async function requireAdmin() {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Niet geautoriseerd");
  return admin;
}

export async function createCreditPack(input: CreditPackInput) {
  const admin = await requireAdmin();
  assertPackInput(input);

  const supabase = createAdminClient();
  const { error } = await supabase.from("credit_packs").insert({
    ...input,
    slug: input.slug.trim().toLowerCase(),
    name: input.name.trim(),
    currency: input.currency.trim().toUpperCase(),
    created_by: admin.id,
    updated_by: admin.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/administration");
}

export async function updateCreditPack(packId: string, input: CreditPackInput) {
  const admin = await requireAdmin();
  assertPackInput(input);
  if (!packId) throw new Error("packId ontbreekt");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("credit_packs")
    .update({
      ...input,
      slug: input.slug.trim().toLowerCase(),
      name: input.name.trim(),
      currency: input.currency.trim().toUpperCase(),
      updated_by: admin.id,
    })
    .eq("id", packId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/administration");
}

export async function setCreditPackActive(packId: string, isActive: boolean) {
  const admin = await requireAdmin();
  if (!packId) throw new Error("packId ontbreekt");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("credit_packs")
    .update({ is_active: isActive, updated_by: admin.id })
    .eq("id", packId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/administration");
}

export async function deleteCreditPack(packId: string) {
  const admin = await requireAdmin();
  if (!packId) throw new Error("packId ontbreekt");

  const supabase = createAdminClient();
  const { data: pack, error: packError } = await supabase
    .from("credit_packs")
    .select("slug")
    .eq("id", packId)
    .maybeSingle<{ slug: string }>();

  if (packError) throw new Error(packError.message);
  if (!pack) throw new Error("Creditpack niet gevonden");

  const { error: iapProductsError } = await supabase
    .from("iap_products")
    .delete()
    .eq("pack_id", packId);

  if (iapProductsError) throw new Error(iapProductsError.message);

  const { error } = await supabase
    .from("credit_packs")
    .update({
      is_active: false,
      slug: `${pack.slug}__deleted__${packId.slice(0, 8)}`,
      updated_by: admin.id,
    })
    .eq("id", packId);

  if (error) throw new Error(error.message);
  await markCreditPackDeleted(packId, admin.id);
  revalidatePath("/admin/administration");
}

export async function purchaseCreditPack(input: {
  userId: string;
  packId: string;
  quantity: number;
  note?: string;
  externalRef?: string;
}) {
  const admin = await requireAdmin();
  if (!input.userId) throw new Error("userId ontbreekt");
  if (!input.packId) throw new Error("packId ontbreekt");
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error("quantity moet een positief geheel getal zijn");
  }

  const deletedPackIds = await getDeletedCreditPackIds();
  if (deletedPackIds.includes(input.packId)) {
    throw new Error("Dit creditpack is verwijderd en kan niet meer gekocht worden.");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("admin_record_credit_pack_purchase", {
    p_user_id: input.userId,
    p_pack_id: input.packId,
    p_quantity: input.quantity,
    p_admin_id: admin.id,
    p_note: input.note?.trim() || null,
    p_external_ref: input.externalRef?.trim() || null,
  });

  if (error) {
    throw new Error(
      `Pack purchase mislukt: ${error.message}. Controleer of sql/credit_administration.sql en sql/content_access_scopes.sql zijn uitgevoerd.`
    );
  }

  revalidatePath("/admin/administration");
  return data as string;
}

export async function grantYearAssignmentsAccess(input: {
  userId: string;
  months?: number;
  note?: string;
}) {
  const admin = await requireAdmin();
  if (!input.userId) throw new Error("userId ontbreekt");

  const months = input.months ?? 12;
  if (!Number.isInteger(months) || months <= 0) {
    throw new Error("months moet een positief geheel getal zijn");
  }

  const startsAt = new Date();
  const endsAt = new Date(startsAt);
  endsAt.setMonth(endsAt.getMonth() + months);

  const supabase = createAdminClient();
  const { data: yearPack, error: yearPackError } = await supabase
    .from("credit_packs")
    .select("id, price_cents, currency, is_active")
    .eq("slug", "jaarabonnement")
    .maybeSingle<{
      id: string;
      price_cents: number;
      currency: string;
      is_active: boolean;
    }>();

  if (yearPackError) throw new Error(yearPackError.message);
  if (!yearPack || !yearPack.is_active) {
    throw new Error(
      "Geen actief jaarabonnement-pack gevonden. Maak/activeer een pack met slug 'jaarabonnement'."
    );
  }

  const { error } = await supabase.from("user_entitlements").insert({
    user_id: input.userId,
    entitlement_key: "year_assignments",
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    is_active: true,
    source: "admin",
    metadata: {
      pack_id: yearPack.id,
      duration_months: months,
      amount_cents: yearPack.price_cents,
      currency: yearPack.currency,
      note: input.note?.trim() || null,
    },
    created_by: admin.id,
  });

  if (error) {
    throw new Error(
      `Jaarabonnement toekennen mislukt: ${error.message}. Controleer of sql/content_access_scopes.sql is uitgevoerd.`
    );
  }

  revalidatePath("/admin/administration");
}
