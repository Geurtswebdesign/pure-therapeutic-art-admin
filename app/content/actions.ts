"use server";

import { createClient } from "../../lib/supabase/server";
import { getContentAccessScope } from "@/lib/content/access";
import { hasAccess } from "@/lib/unlock/hasAccess";

export async function unlockContentItem(contentItemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && (await hasAccess(user.id, contentItemId))) {
    return {
      unlocked: true,
      already_unlocked: true,
    };
  }

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
