import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { AppProfileData } from "@/lib/users/accountTypes";
import { getProfileAccountType } from "@/lib/users/accountTypes";
import {
  THERAPIST_DIRECTORY_ENTITLEMENT_KEY,
  getTimedEntitlementSummary,
} from "@/lib/users/entitlements";

type ProfileRow = {
  profile_data?: AppProfileData | null;
};

type TherapistEntitlementRow = {
  starts_at: string;
  ends_at: string | null;
  is_active: boolean | null;
  created_at: string;
};

export async function getTherapistDirectoryEntitlementSummary(userId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("user_entitlements")
    .select("starts_at, ends_at, is_active, created_at")
    .eq("user_id", userId)
    .eq("entitlement_key", THERAPIST_DIRECTORY_ENTITLEMENT_KEY)
    .order("created_at", { ascending: false })
    .returns<TherapistEntitlementRow[]>();

  return getTimedEntitlementSummary(data ?? []);
}

export async function getTherapistDirectoryAccessState(userId: string) {
  const supabase = createAdminClient();
  const [{ data: profile }, entitlementSummary] = await Promise.all([
    supabase
      .from("profiles")
      .select("profile_data")
      .eq("user_id", userId)
      .maybeSingle<ProfileRow>(),
    getTherapistDirectoryEntitlementSummary(userId),
  ]);

  const accountType = getProfileAccountType(profile?.profile_data ?? null);
  const isTherapist = accountType === "therapist";
  const hasActiveTherapistDirectoryAccess =
    entitlementSummary.status === "active";

  return {
    accountType,
    isTherapist,
    entitlementStatus: entitlementSummary.status,
    hasActiveTherapistDirectoryAccess,
    hasPaidTherapistAccount: entitlementSummary.status !== "ended",
    shouldShowTherapistSubscriptionShopOption:
      isTherapist && entitlementSummary.status === "ended",
  };
}
