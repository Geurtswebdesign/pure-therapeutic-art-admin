import { createAdminClient } from "@/lib/supabase-admin";

export async function getBalance(userId: string): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("credit_wallets")
    .select("credits_available")
    .eq("user_id", userId)
    .single();

  if (error) return 0;
  return data?.credits_available ?? 0;
}
