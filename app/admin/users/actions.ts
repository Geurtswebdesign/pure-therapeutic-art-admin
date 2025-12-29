"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function adjustCredits(
  userId: string,
  delta: number
) {
  if (!userId || delta === 0) {
    return;
  }

  const { error: rpcError } = await supabaseAdmin.rpc(
    "adjust_user_credits",
    {
      p_user_id: userId,
      p_delta: delta,
    }
  );

  if (rpcError) {
    // Bewust NIET crashen
    console.error("CREDIT ERROR:", rpcError.message);
    return;
  }

  await supabaseAdmin.from("credit_transactions").insert({
    user_id: userId,
    delta,
    reason: "admin_adjust",
  });

  // Zorgt dat de users-lijst opnieuw wordt opgehaald
  revalidatePath("/admin/users");
}
