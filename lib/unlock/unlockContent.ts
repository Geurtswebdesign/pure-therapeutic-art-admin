"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { revalidatePath } from "next/cache";

export async function unlockContent({
  contentItemId,
  cost,
}: {
  contentItemId: string;
  cost: number;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Niet ingelogd");

  const supabase = createAdminClient();

  const { error } = await supabase.rpc(
    "unlock_content_item",
    {
      p_user_id: user.id,
      p_content_item_id: contentItemId,
      p_cost: cost,
    }
  );

  if (error) {
    console.error("[unlockContent]", error);
    throw new Error(error.message);
  }

  revalidatePath(`/content/${contentItemId}`);
}
