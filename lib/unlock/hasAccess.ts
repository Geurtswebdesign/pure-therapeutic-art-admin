"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function hasAccess(userId: string, contentItemId: string): Promise<boolean> {
  if (!userId || !contentItemId) return false;

  const supabase = createAdminClient();

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
