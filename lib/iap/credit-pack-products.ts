import { createAdminClient } from "@/lib/supabase/admin";
import { isTherapistSubscriptionPackSlug } from "@/lib/users/entitlements";

type CreditScope = "assignment" | "book" | "game" | "referral";

type CreditPackLike = {
  id: string;
  slug: string;
  name: string;
  credit_scope: CreditScope;
  credits_base: number;
  bonus_credits: number;
  is_active?: boolean;
};

type IapProductRow = {
  pack_id: string;
  platform: "apple" | "google";
  store_product_id: string;
  is_active: boolean;
};

function normalizeLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getPackTotal(pack: CreditPackLike) {
  return pack.credits_base + pack.bonus_credits;
}

function isRevenueCatCreditPack(pack: CreditPackLike) {
  if (pack.is_active === false) {
    return false;
  }

  if (isTherapistSubscriptionPackSlug(pack.slug)) {
    return false;
  }

  if (normalizeLabel(pack.slug) === "jaarabonnement") {
    return false;
  }

  return getPackTotal(pack) > 0;
}

function getPackProductKey(pack: CreditPackLike) {
  if (!isRevenueCatCreditPack(pack)) {
    return null;
  }

  const total = getPackTotal(pack);
  const slug = normalizeLabel(pack.slug);
  const name = normalizeLabel(pack.name);
  const combined = `${slug} ${name}`;

  if (total === 10 || combined.includes("start") || combined.includes("starter")) {
    return "start";
  }

  if (total === 50 || combined.includes("basis")) {
    return "basis";
  }

  if (
    total === 100 ||
    combined.includes("standaard") ||
    combined.includes("standard")
  ) {
    return "standaard";
  }

  if (total === 150 || combined.includes("plus")) {
    return "plus";
  }

  if (total === 200 || combined.includes("voordeel")) {
    return "voordeel";
  }

  return slug.replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") || null;
}

export function getDefaultCreditPackStoreProductId(pack: CreditPackLike) {
  const productKey = getPackProductKey(pack);
  if (!productKey) {
    return null;
  }

  return `credits.${pack.credit_scope}.${productKey}`;
}

function getLegacyCreditPackStoreProductId(pack: CreditPackLike) {
  const defaultProductId = getDefaultCreditPackStoreProductId(pack);
  if (!defaultProductId) {
    return null;
  }

  return `com.detroostboom.puretherapeuticart.${defaultProductId}`;
}

export async function getCreditPackStoreProducts(packIds: string[]) {
  if (!packIds.length) {
    return new Map<
      string,
      {
        appleStoreProductId: string | null;
        googleStoreProductId: string | null;
      }
    >();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("iap_products")
    .select("pack_id, platform, store_product_id, is_active")
    .in("pack_id", packIds)
    .eq("is_active", true)
    .returns<IapProductRow[]>();

  if (error) {
    throw error;
  }

  const mappings = new Map<
    string,
    {
      appleStoreProductId: string | null;
      googleStoreProductId: string | null;
    }
  >();

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

export async function resolveCreditPackIdByStoreProductId(
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
    .select("pack_id, is_active")
    .eq("platform", platform)
    .eq("store_product_id", normalizedStoreProductId)
    .eq("is_active", true)
    .maybeSingle<{ pack_id: string; is_active: boolean }>();

  if (mappedProductError) {
    throw mappedProductError;
  }

  if (mappedProduct?.pack_id) {
    const { data: pack, error: packError } = await supabase
      .from("credit_packs")
      .select("id, slug, name, credit_scope, credits_base, bonus_credits, is_active")
      .eq("id", mappedProduct.pack_id)
      .maybeSingle<CreditPackLike>();

    if (packError) {
      throw packError;
    }

    if (pack && isRevenueCatCreditPack(pack)) {
      return pack.id;
    }
  }

  const { data: packs, error: packsError } = await supabase
    .from("credit_packs")
    .select("id, slug, name, credit_scope, credits_base, bonus_credits, is_active")
    .eq("is_active", true)
    .returns<CreditPackLike[]>();

  if (packsError) {
    throw packsError;
  }

  for (const pack of packs ?? []) {
    if (!isRevenueCatCreditPack(pack)) {
      continue;
    }

    if (
      getDefaultCreditPackStoreProductId(pack) === normalizedStoreProductId ||
      getLegacyCreditPackStoreProductId(pack) === normalizedStoreProductId
    ) {
      return pack.id;
    }
  }

  return null;
}
