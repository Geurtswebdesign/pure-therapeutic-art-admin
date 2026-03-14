export const YEAR_ASSIGNMENTS_ENTITLEMENT_KEY = "year_assignments";
export const THERAPIST_DIRECTORY_ENTITLEMENT_KEY = "therapist_directory";

export const THERAPIST_MONTHLY_PACK_SLUG = "therapeut-maandabonnement";
export const THERAPIST_YEARLY_PACK_SLUG = "therapeut-jaarabonnement";

export type TherapistSubscriptionPlan = "monthly" | "yearly";

export type TimedEntitlementRecord = {
  starts_at: string;
  ends_at: string | null;
  is_active?: boolean | null;
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

export function getTherapistSubscriptionMonths(plan: TherapistSubscriptionPlan) {
  return plan === "monthly" ? 1 : 12;
}

export function getTherapistSubscriptionPackSlug(plan: TherapistSubscriptionPlan) {
  return plan === "monthly"
    ? THERAPIST_MONTHLY_PACK_SLUG
    : THERAPIST_YEARLY_PACK_SLUG;
}
