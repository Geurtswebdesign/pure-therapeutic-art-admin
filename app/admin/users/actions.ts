"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { CREDIT_REASONS, CreditReason } from "./_lib/creditReasons";

export async function adjustCredits(
  userId: string,
  delta: number,
  reason?: string
) {
  await requireAdmin();

  if (!userId || delta === 0) return;

  // 🔒 Reason afdwingen (NOOIT fout)
  const safeReason: CreditReason =
    reason && reason in CREDIT_REASONS
      ? (reason as CreditReason)
      : "admin";

  // 1️⃣ Credits aanpassen
  const { error: rpcError } = await supabaseAdmin.rpc(
    "adjust_user_credits",
    {
      p_user_id: userId,
      p_delta: delta,
    }
  );

  if (rpcError) {
    console.error("CREDIT RPC ERROR:", rpcError.message);
    return;
  }

  // 2️⃣ History opslaan (DIT WAS HET PROBLEEM)
  const { error: txError } = await supabaseAdmin
    .from("credit_transactions")
    .insert({
      user_id: userId,
      delta,
      reason: safeReason,
    });

  if (txError) {
    console.error("CREDIT HISTORY ERROR:", txError.message);
    return;
  }

  // 3️⃣ UI verversen
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}
