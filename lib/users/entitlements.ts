export const YEAR_ASSIGNMENTS_ENTITLEMENT_KEY = "year_assignments";
export const THERAPIST_DIRECTORY_ENTITLEMENT_KEY = "therapist_directory";

export const THERAPIST_MONTHLY_PACK_SLUG = "therapeut-maand";
export const THERAPIST_YEARLY_PACK_SLUG = "therapeut-jaar";
export const LEGACY_THERAPIST_MONTHLY_PACK_SLUG = "therapeut-maandabonnement";
export const LEGACY_THERAPIST_YEARLY_PACK_SLUG = "therapeut-jaarabonnement";

export type TherapistSubscriptionPlan = "monthly" | "yearly";

export type TimedEntitlementRecord = {
  starts_at: string;
  ends_at: string | null;
  is_active?: boolean | null;
};

export type TimedEntitlementSummaryStatus = "active" | "planned" | "ended";

export type TimedEntitlementSummary<T extends TimedEntitlementRecord> = {
  current: T | null;
  next: T | null;
  latestRelevantEndAt: string | null;
  hasOpenEnded: boolean;
  status: TimedEntitlementSummaryStatus;
};

export function isTimedEntitlementActive(
  entitlement: TimedEntitlementRecord,
  nowIso = new Date().toISOString()
) {
  if (entitlement.is_active === false) {
    return false;
  }

  if (entitlement.starts_at > nowIso) {
    return false;
  }

  if (!entitlement.ends_at) {
    return true;
  }

  return entitlement.ends_at > nowIso;
}

function compareTimedEntitlementsByEndDesc<T extends TimedEntitlementRecord>(a: T, b: T) {
  if (!a.ends_at && !b.ends_at) {
    return b.starts_at.localeCompare(a.starts_at);
  }

  if (!a.ends_at) {
    return -1;
  }

  if (!b.ends_at) {
    return 1;
  }

  if (a.ends_at === b.ends_at) {
    return b.starts_at.localeCompare(a.starts_at);
  }

  return b.ends_at.localeCompare(a.ends_at);
}

export function getTimedEntitlementSummary<T extends TimedEntitlementRecord>(
  entitlements: T[],
  nowIso = new Date().toISOString()
): TimedEntitlementSummary<T> {
  const activeEntitlements = entitlements
    .filter((item) => isTimedEntitlementActive(item, nowIso))
    .sort(compareTimedEntitlementsByEndDesc);
  const futureEntitlements = entitlements
    .filter((item) => item.is_active !== false && item.starts_at > nowIso)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const relevantEntitlements = [...activeEntitlements, ...futureEntitlements];
  const hasOpenEnded = relevantEntitlements.some((item) => !item.ends_at);

  const latestRelevantEndAt = hasOpenEnded
    ? null
    : relevantEntitlements.reduce<string | null>((latest, item) => {
        if (!item.ends_at) {
          return latest;
        }

        if (!latest || item.ends_at > latest) {
          return item.ends_at;
        }

        return latest;
      }, null);

  return {
    current: activeEntitlements[0] ?? null,
    next: futureEntitlements[0] ?? null,
    latestRelevantEndAt,
    hasOpenEnded,
    status: activeEntitlements[0]
      ? "active"
      : futureEntitlements[0]
        ? "planned"
        : "ended",
  };
}

export function getTherapistSubscriptionMonths(plan: TherapistSubscriptionPlan) {
  return plan === "monthly" ? 1 : 12;
}

export function getTherapistSubscriptionPackSlug(plan: TherapistSubscriptionPlan) {
  return plan === "monthly"
    ? THERAPIST_MONTHLY_PACK_SLUG
    : THERAPIST_YEARLY_PACK_SLUG;
}

export function getTherapistSubscriptionPackSlugs(plan: TherapistSubscriptionPlan) {
  return plan === "monthly"
    ? [THERAPIST_MONTHLY_PACK_SLUG, LEGACY_THERAPIST_MONTHLY_PACK_SLUG]
    : [THERAPIST_YEARLY_PACK_SLUG, LEGACY_THERAPIST_YEARLY_PACK_SLUG];
}

export function isTherapistSubscriptionPackSlug(slug: string | null | undefined) {
  return (
    slug === THERAPIST_MONTHLY_PACK_SLUG ||
    slug === THERAPIST_YEARLY_PACK_SLUG ||
    slug === LEGACY_THERAPIST_MONTHLY_PACK_SLUG ||
    slug === LEGACY_THERAPIST_YEARLY_PACK_SLUG
  );
}
