"use server";

import { createClient } from "../../lib/supabase/server";

export async function unlockContentItem(contentItemId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("unlock_content_item", {
    p_content_item_id: contentItemId,
  });

  console.log("UNLOCK RESULT:", data);

  if (error) {
    console.error("unlockContentItem error:", error);
    throw new Error("Unlock mislukt");
  }

  return data;
}
