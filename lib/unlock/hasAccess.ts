"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getContentAccessScope } from "@/lib/content/access";

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
      .eq("entitlement_key", "year_assignments")
      .eq("is_active", true)
      .returns<{ id: string; starts_at: string; ends_at: string | null }[]>();

    const hasActiveEntitlement =
      (entitlements ?? []).some((item) => {
        if (item.starts_at > nowIso) return false;
        if (!item.ends_at) return true;
        return item.ends_at > nowIso;
      });

    if (hasActiveEntitlement) return true;
  }

  const { data, error } = await supabase
    .from("content_unlocks")
    .select("id")
    .eq("user_id", userId)
    .eq("content_item_id", contentItemId)
    .maybeSingle();

  if (error) {
    console.error("[hasAccess]", error);
    return false;
  }

  return !!data;
}
