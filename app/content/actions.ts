"use server";

import { createClient } from "../../lib/supabase/server";
import { getContentAccessScope } from "@/lib/content/access";

export async function unlockContentItem(contentItemId: string) {
  const supabase = await createClient();
  const scope = await getContentAccessScope(contentItemId);

  const { data, error } =
    scope === "assignment"
      ? await supabase.rpc("unlock_content_item", {
          p_content_item_id: contentItemId,
        })
      : await supabase.rpc("unlock_scoped_content_item", {
          p_content_item_id: contentItemId,
        });

  console.log("UNLOCK RESULT:", data);

  if (error) {
    console.error("unlockContentItem error:", error);
    throw new Error("Ontgrendelen mislukt");
  }

  return data;
}
