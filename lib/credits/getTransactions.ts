import { createAdminClient } from "@/lib/supabase/admin";
import type { CreditTransaction } from "./types";

export async function getTransactions(
  userId: string
): Promise<CreditTransaction[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getTransactions]", error);
    return [];
  }

  return data ?? [];
}
