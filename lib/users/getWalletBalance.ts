import { createClient } from "@/lib/supabase/server";

export async function getWalletBalance(userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("credit_wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  return data?.balance ?? 0;
}
