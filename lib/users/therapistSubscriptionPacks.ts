import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSubscriptionPackStoreProducts } from "@/lib/iap/subscription-products";
import {
  getTherapistSubscriptionPackSlugs,
  type TherapistSubscriptionPlan,
} from "@/lib/users/entitlements";

export type TherapistSubscriptionPackOption = {
  id: string;
  slug: string;
  name: string;
  plan: TherapistSubscriptionPlan;
  price_cents: number;
  currency: string;
  appleStoreProductId: string;
  googleStoreProductId: string;
};

const PLAN_ORDER: TherapistSubscriptionPlan[] = ["monthly", "yearly"];

type CreditPackRow = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  currency: string;
  is_active: boolean;
};

export async function getActiveTherapistSubscriptionPacks(): Promise<
  TherapistSubscriptionPackOption[]
> {
  try {
    const supabase = createAdminClient();
    const allSlugs = PLAN_ORDER.flatMap((plan) =>
      getTherapistSubscriptionPackSlugs(plan)
    );

    const { data, error } = await supabase
      .from("credit_packs")
      .select("id, slug, name, price_cents, currency, is_active")
      .in("slug", allSlugs)
      .eq("is_active", true)
      .returns<CreditPackRow[]>();

    if (error) {
      return [];
    }

    const storeProducts = await getSubscriptionPackStoreProducts(data ?? []);

    return PLAN_ORDER.flatMap((plan) => {
      const pack = getTherapistSubscriptionPackSlugs(plan)
        .map((slug) => (data ?? []).find((entry) => entry.slug === slug))
        .find(Boolean);

      const mappedProducts = pack ? storeProducts.get(pack.id) : null;

      return pack
        ? [
            {
              id: pack.id,
              slug: pack.slug,
              name: pack.name,
              plan,
              price_cents: pack.price_cents,
              currency: pack.currency,
              appleStoreProductId: mappedProducts?.appleStoreProductId ?? "",
              googleStoreProductId: mappedProducts?.googleStoreProductId ?? "",
            },
          ]
        : [];
    });
  } catch {
    return [];
  }
}

export async function getActiveTherapistSubscriptionPack(
  plan: TherapistSubscriptionPlan
) {
  const packs = await getActiveTherapistSubscriptionPacks();
  return packs.find((pack) => pack.plan === plan) ?? null;
}
