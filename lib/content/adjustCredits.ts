"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { getAdminSession } from "@/lib/auth/getAdminSession";
import { revalidatePath } from "next/cache";

export async function adjustCredits(
  userId: string,
  delta: number,
  reason = "admin_adjust"
): Promise<void> {
  if (!userId) throw new Error("UserId ontbreekt");
  if (!Number.isInteger(delta)) throw new Error("Delta moet een integer zijn");

  // 🔐 Admin check
  const session = await getAdminSession();
  if (!session) throw new Error("Niet geautoriseerd");

  const adminId = session.user.id;
  const supabase = createAdminClient();

  const { error } = await supabase.rpc("admin_adjust_credits", {
    p_user_id: userId,
    p_delta: delta,
    p_reason: reason,
    p_admin_id: adminId,
  });

  if (error) {
    console.error("[adjustCredits]", error);
    throw new Error("Credits aanpassen mislukt");
  }

  revalidatePath(`/admin/users/${userId}`);
}
