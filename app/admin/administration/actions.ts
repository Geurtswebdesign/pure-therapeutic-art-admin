"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth/getAdminUser";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getDeletedCreditPackIds,
  markCreditPackDeleted,
} from "@/lib/credits/deletedPacks";
import {
  getTherapistSubscriptionMonths,
  getTherapistSubscriptionPackSlug,
  getTherapistSubscriptionPackSlugs,
  isTimedEntitlementActive,
  THERAPIST_DIRECTORY_ENTITLEMENT_KEY,
  type TherapistSubscriptionPlan,
} from "@/lib/users/entitlements";

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

function addMonths(baseDate: Date, months: number) {
  const endDate = new Date(baseDate);
  endDate.setMonth(endDate.getMonth() + months);
  return endDate;
}

async function getTherapistSubscriptionPack(plan: TherapistSubscriptionPlan) {
  const supabase = createAdminClient();
  const slugs = getTherapistSubscriptionPackSlugs(plan);
  const { data: packs, error } = await supabase
    .from("credit_packs")
    .select("id, name, price_cents, currency, is_active")
    .in("slug", slugs)
    .returns<Array<{
      id: string;
      name: string;
      price_cents: number;
      currency: string;
      is_active: boolean;
    }>>();

  if (error) throw new Error(error.message);
  const pack = (packs ?? []).find((item) => item.is_active);
  if (!pack || !pack.is_active) {
    throw new Error(
      `Geen actief therapeut-abonnement gevonden voor '${slugs.join("' of '")}'. Maak of activeer dit pack in Administratie > Credits.`
    );
  }

  return pack;
}

async function upsertTherapistSubscriptionPack(input: {
  adminId: string;
  plan: TherapistSubscriptionPlan;
  priceCents: number;
  currency: string;
}) {
  const supabase = createAdminClient();
  const slug = getTherapistSubscriptionPackSlug(input.plan);
  const name =
    input.plan === "monthly"
      ? "Therapeut maandabonnement"
      : "Therapeut jaarabonnement";
  const sortOrder = input.plan === "monthly" ? 9000 : 9001;

  const { data: existingPack, error: existingPackError } = await supabase
    .from("credit_packs")
    .select("id")
    .eq("slug", slug)
    .maybeSingle<{ id: string }>();

  if (existingPackError) throw new Error(existingPackError.message);

  const payload = {
    slug,
    name,
    credit_scope: "assignment" as const,
    credits_base: 1,
    bonus_credits: 0,
    price_cents: input.priceCents,
    currency: input.currency,
    sort_order: sortOrder,
    is_active: true,
    updated_by: input.adminId,
  };

  if (existingPack?.id) {
    const { error } = await supabase
      .from("credit_packs")
      .update(payload)
      .eq("id", existingPack.id);

    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("credit_packs").insert({
    ...payload,
    created_by: input.adminId,
  });

  if (error) throw new Error(error.message);
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

export async function grantTherapistDirectoryAccess(input: {
  userId: string;
  plan: TherapistSubscriptionPlan;
  months?: number;
  note?: string;
}) {
  const admin = await requireAdmin();
  if (!input.userId) throw new Error("userId ontbreekt");
  if (input.plan !== "monthly" && input.plan !== "yearly") {
    throw new Error("plan is ongeldig");
  }
  const months = input.months ?? getTherapistSubscriptionMonths(input.plan);
  if (!Number.isInteger(months) || months <= 0) {
    throw new Error("months moet een positief geheel getal zijn");
  }

  const supabase = createAdminClient();
  const pack = await getTherapistSubscriptionPack(input.plan);
  const now = new Date();
  const nowIso = now.toISOString();

  const { data: existingEntitlements, error: entitlementError } = await supabase
    .from("user_entitlements")
    .select("starts_at, ends_at, is_active")
    .eq("user_id", input.userId)
    .eq("entitlement_key", THERAPIST_DIRECTORY_ENTITLEMENT_KEY)
    .eq("is_active", true)
    .returns<Array<{ starts_at: string; ends_at: string | null; is_active: boolean }>>();

  if (entitlementError) {
    throw new Error(`Therapeut-abonnement ophalen mislukt: ${entitlementError.message}`);
  }

  const activeOrPlannedEntitlements = (existingEntitlements ?? []).filter((item) =>
    isTimedEntitlementActive(item, nowIso) || item.starts_at > nowIso
  );

  const latestEndAt = activeOrPlannedEntitlements.reduce<string | null>((latest, item) => {
    if (!item.ends_at) return latest;
    if (!latest || item.ends_at > latest) {
      return item.ends_at;
    }
    return latest;
  }, null);

  const startsAt =
    latestEndAt && latestEndAt > nowIso ? new Date(latestEndAt) : now;
  const endsAt = addMonths(startsAt, months);

  const { error } = await supabase.from("user_entitlements").insert({
    user_id: input.userId,
    entitlement_key: THERAPIST_DIRECTORY_ENTITLEMENT_KEY,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    is_active: true,
    source: "admin",
    metadata: {
      pack_id: pack.id,
      pack_name: pack.name,
      plan: input.plan,
      duration_months: months,
      amount_cents: pack.price_cents,
      currency: pack.currency,
      note: input.note?.trim() || null,
    },
    created_by: admin.id,
  });

  if (error) {
    throw new Error(`Therapeut-abonnement toekennen mislukt: ${error.message}`);
  }

  revalidatePath("/admin/administration");
  revalidatePath(`/admin/users/${input.userId}`);
  revalidatePath("/therapeuten");
}

export async function saveTherapistSubscriptionPackPricing(input: {
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  currency?: string;
}) {
  const admin = await requireAdmin();

  if (!Number.isInteger(input.monthlyPriceCents) || input.monthlyPriceCents < 0) {
    throw new Error("monthlyPriceCents moet 0 of hoger zijn");
  }
  if (!Number.isInteger(input.yearlyPriceCents) || input.yearlyPriceCents < 0) {
    throw new Error("yearlyPriceCents moet 0 of hoger zijn");
  }

  const currency = input.currency?.trim().toUpperCase() || "EUR";

  await upsertTherapistSubscriptionPack({
    adminId: admin.id,
    plan: "monthly",
    priceCents: input.monthlyPriceCents,
    currency,
  });
  await upsertTherapistSubscriptionPack({
    adminId: admin.id,
    plan: "yearly",
    priceCents: input.yearlyPriceCents,
    currency,
  });

  revalidatePath("/admin/administration");
}
