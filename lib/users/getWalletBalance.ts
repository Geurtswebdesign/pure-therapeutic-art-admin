import { createClient } from "@/lib/supabase/server";

export async function getWalletBalance(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("credit_wallets")
    .select("credits_available")
    .eq("user_id", userId)
    .single();

  if (error) {
    // als er geen wallet row is, wil je meestal 0 teruggeven
    return 0;
  }

  return data?.credits_available ?? 0;
}
