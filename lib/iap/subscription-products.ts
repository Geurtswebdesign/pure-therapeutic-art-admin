import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  THERAPIST_DIRECTORY_ENTITLEMENT_KEY,
  YEAR_ASSIGNMENTS_ENTITLEMENT_KEY,
  getTherapistSubscriptionMonths,
  getTherapistSubscriptionPackSlugs,
  type TherapistSubscriptionPlan,
} from "@/lib/users/entitlements";

type SubscriptionPackLike = {
  id: string;
  slug: string;
  name: string;
  is_active?: boolean;
};

type IapProductRow = {
  pack_id: string;
  platform: "apple" | "google";
  store_product_id: string;
  is_active: boolean;
};

export type SubscriptionPackKind =
  | "year_assignments"
  | "therapist_monthly"
  | "therapist_yearly";

export type SubscriptionStoreProductIds = {
  appleStoreProductId: string | null;
  googleStoreProductId: string | null;
};

export type ResolvedSubscriptionPack = {
  packId: string;
  packName: string;
  packSlug: string;
  kind: SubscriptionPackKind;
  entitlementKey:
    | typeof YEAR_ASSIGNMENTS_ENTITLEMENT_KEY
    | typeof THERAPIST_DIRECTORY_ENTITLEMENT_KEY;
  durationMonths: number;
  therapistPlan: TherapistSubscriptionPlan | null;
  appleStoreProductId: string | null;
  googleStoreProductId: string | null;
};

const THERAPIST_MONTHLY_GOOGLE_PRODUCT_IDS = [
  "therapeut:therapeut-maand",
  "therapeut-maand:monthly-autorenewing",
] as const;

const THERAPIST_YEARLY_GOOGLE_PRODUCT_IDS = [
  "therapeut:therapeut-jaar",
  "therapeut-jaar:annual-autorenewing",
] as const;

function normalizeLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isYearSubscriptionPackSlug(slug: string | null | undefined) {
  return normalizeLabel(slug ?? "") === "jaarabonnement";
}

export function getSubscriptionPackKind(
  pack: Pick<SubscriptionPackLike, "slug"> | string | null | undefined
): SubscriptionPackKind | null {
  const slug = typeof pack === "string" ? pack : pack?.slug;
  if (!slug) {
    return null;
  }

  if (isYearSubscriptionPackSlug(slug)) {
    return "year_assignments";
  }

  if (getTherapistSubscriptionPackSlugs("monthly").includes(slug)) {
    return "therapist_monthly";
  }

  if (getTherapistSubscriptionPackSlugs("yearly").includes(slug)) {
    return "therapist_yearly";
  }

  return null;
}

export function getDefaultSubscriptionStoreProductIds(
  pack: Pick<SubscriptionPackLike, "slug"> | string | null | undefined
): SubscriptionStoreProductIds | null {
  const kind = getSubscriptionPackKind(pack);

  if (!kind) {
    return null;
  }

  if (kind === "year_assignments") {
    return {
      appleStoreProductId: "jaarabonnement",
      googleStoreProductId: "jaarabonnement:annual-autorenewing",
    };
  }

  if (kind === "therapist_monthly") {
    return {
      appleStoreProductId: "therapeut-maand",
      googleStoreProductId: THERAPIST_MONTHLY_GOOGLE_PRODUCT_IDS[0],
    };
  }

  return {
    appleStoreProductId: "therapeut-jaar",
    googleStoreProductId: THERAPIST_YEARLY_GOOGLE_PRODUCT_IDS[0],
  };
}

function getSupportedGoogleSubscriptionProductIds(kind: SubscriptionPackKind) {
  if (kind === "year_assignments") {
    return ["jaarabonnement:annual-autorenewing"];
  }

  if (kind === "therapist_monthly") {
    return [...THERAPIST_MONTHLY_GOOGLE_PRODUCT_IDS];
  }

  return [...THERAPIST_YEARLY_GOOGLE_PRODUCT_IDS];
}

function buildResolvedSubscriptionPack(
  pack: SubscriptionPackLike,
  storeProductIds: SubscriptionStoreProductIds
): ResolvedSubscriptionPack | null {
  const kind = getSubscriptionPackKind(pack);
  if (!kind) {
    return null;
  }

  if (kind === "year_assignments") {
    return {
      packId: pack.id,
      packName: pack.name,
      packSlug: pack.slug,
      kind,
      entitlementKey: YEAR_ASSIGNMENTS_ENTITLEMENT_KEY,
      durationMonths: 12,
      therapistPlan: null,
      ...storeProductIds,
    };
  }

  const therapistPlan: TherapistSubscriptionPlan =
    kind === "therapist_monthly" ? "monthly" : "yearly";

  return {
    packId: pack.id,
    packName: pack.name,
    packSlug: pack.slug,
    kind,
    entitlementKey: THERAPIST_DIRECTORY_ENTITLEMENT_KEY,
    durationMonths: getTherapistSubscriptionMonths(therapistPlan),
    therapistPlan,
    ...storeProductIds,
  };
}

export async function getSubscriptionPackStoreProducts(packs: SubscriptionPackLike[]) {
  if (!packs.length) {
    return new Map<string, SubscriptionStoreProductIds>();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("iap_products")
    .select("pack_id, platform, store_product_id, is_active")
    .in(
      "pack_id",
      packs.map((pack) => pack.id)
    )
    .eq("is_active", true)
    .returns<IapProductRow[]>();

  if (error) {
    throw error;
  }

  const mappings = new Map<string, SubscriptionStoreProductIds>();

  for (const pack of packs) {
    const defaults = getDefaultSubscriptionStoreProductIds(pack);
    if (!defaults) {
      continue;
    }

    mappings.set(pack.id, { ...defaults });
  }

  for (const row of data ?? []) {
    const current = mappings.get(row.pack_id) ?? {
      appleStoreProductId: null,
      googleStoreProductId: null,
    };

    if (row.platform === "apple") {
      current.appleStoreProductId = row.store_product_id;
    }

    if (row.platform === "google") {
      current.googleStoreProductId = row.store_product_id;
    }

    mappings.set(row.pack_id, current);
  }

  return mappings;
}

export async function resolveSubscriptionPackByStoreProductId(
  platform: "apple" | "google",
  storeProductId: string
) {
  const normalizedStoreProductId = storeProductId.trim();
  if (!normalizedStoreProductId) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: mappedProduct, error: mappedProductError } = await supabase
    .from("iap_products")
    .select("pack_id")
    .eq("platform", platform)
    .eq("store_product_id", normalizedStoreProductId)
    .eq("is_active", true)
    .maybeSingle<{ pack_id: string }>();

  if (mappedProductError) {
    throw mappedProductError;
  }

  if (mappedProduct?.pack_id) {
    const { data: pack, error: packError } = await supabase
      .from("credit_packs")
      .select("id, slug, name, is_active")
      .eq("id", mappedProduct.pack_id)
      .maybeSingle<SubscriptionPackLike>();

    if (packError) {
      throw packError;
    }

    if (pack && pack.is_active !== false) {
      const resolved = buildResolvedSubscriptionPack(pack, {
        appleStoreProductId:
          platform === "apple" ? normalizedStoreProductId : null,
        googleStoreProductId:
          platform === "google" ? normalizedStoreProductId : null,
      });

      if (resolved) {
        return resolved;
      }
    }
  }

  const { data: packs, error: packsError } = await supabase
    .from("credit_packs")
    .select("id, slug, name, is_active")
    .eq("is_active", true)
    .returns<SubscriptionPackLike[]>();

  if (packsError) {
    throw packsError;
  }

  for (const pack of packs ?? []) {
    const defaults = getDefaultSubscriptionStoreProductIds(pack);
    const kind = getSubscriptionPackKind(pack);
    if (!defaults || !kind) {
      continue;
    }

    const candidates =
      platform === "apple"
        ? [defaults.appleStoreProductId]
        : getSupportedGoogleSubscriptionProductIds(kind);

    if (!candidates.includes(normalizedStoreProductId)) {
      continue;
    }

    const resolved = buildResolvedSubscriptionPack(pack, defaults);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}
