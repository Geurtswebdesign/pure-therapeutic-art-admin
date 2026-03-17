import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
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

  return PLAN_ORDER.flatMap((plan) => {
    const pack = getTherapistSubscriptionPackSlugs(plan)
      .map((slug) => (data ?? []).find((entry) => entry.slug === slug))
      .find(Boolean);

    return pack
      ? [
          {
            id: pack.id,
            slug: pack.slug,
            name: pack.name,
            plan,
            price_cents: pack.price_cents,
            currency: pack.currency,
          },
        ]
      : [];
  });
}

export async function getActiveTherapistSubscriptionPack(
  plan: TherapistSubscriptionPlan
) {
  const packs = await getActiveTherapistSubscriptionPacks();
  return packs.find((pack) => pack.plan === plan) ?? null;
}
