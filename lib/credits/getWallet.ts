import { createAdminClient } from "@/lib/supabase/admin";
import type { CreditWallet } from "./types";

export async function getWallet(
  userId: string
): Promise<CreditWallet | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("credit_wallets")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("[getWallet]", error);
    return null;
  }

  return data;
}
