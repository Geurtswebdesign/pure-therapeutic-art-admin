"use server";

import { createClient } from "@/lib/supabase/server";

export async function unlockContentItem(contentItemId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("unlock_content_item", {
    p_content_item_id: contentItemId,
  });

  if (error) {
    console.error("unlockContentItem error:", error);
    throw new Error("Unlock mislukt");
  }

  return data as
    | { unlocked: true; cost: number; new_balance?: number; already?: boolean }
    | { unlocked: false; error: "INSUFFICIENT_CREDITS"; cost: number; balance: number };
}
