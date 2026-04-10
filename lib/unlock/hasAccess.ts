"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getContentAccessScope } from "@/lib/content/access";
import { getTranslationFamilyIds } from "@/lib/content/translation-family";
import {
  isTimedEntitlementActive,
  YEAR_ASSIGNMENTS_ENTITLEMENT_KEY,
} from "@/lib/users/entitlements";

export async function hasAccess(userId: string, contentItemId: string): Promise<boolean> {
  if (!userId || !contentItemId) return false;

  const supabase = createAdminClient();
  const scope = await getContentAccessScope(contentItemId);

  if (scope === "assignment") {
    const nowIso = new Date().toISOString();
    const { data: entitlements } = await supabase
      .from("user_entitlements")
      .select("id, starts_at, ends_at")
      .eq("user_id", userId)
      .eq("entitlement_key", YEAR_ASSIGNMENTS_ENTITLEMENT_KEY)
      .eq("is_active", true)
      .returns<{ id: string; starts_at: string; ends_at: string | null }[]>();

    const hasActiveEntitlement = (entitlements ?? []).some((item) =>
      isTimedEntitlementActive(item, nowIso)
    );

    if (hasActiveEntitlement) return true;
  }

  const familyIds = await getTranslationFamilyIds(contentItemId);

  const { data, error } = await supabase
    .from("content_unlocks")
    .select("id")
    .eq("user_id", userId)
    .in("content_item_id", familyIds)
    .limit(1);

  if (error) {
    console.error("[hasAccess]", error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}
