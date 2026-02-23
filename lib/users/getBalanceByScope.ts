import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentAccessScope } from "@/lib/content/access";

export async function getBalanceByScope(
  userId: string,
  scope: ContentAccessScope
): Promise<number> {
  const supabase = createAdminClient();

  if (scope === "assignment") {
    const { data } = await supabase
      .from("credit_wallets")
      .select("credits_available")
      .eq("user_id", userId)
      .maybeSingle<{ credits_available: number }>();

    return data?.credits_available ?? 0;
  }

  const { data } = await supabase
    .from("user_credit_scopes")
    .select("credits_available")
    .eq("user_id", userId)
    .eq("credit_scope", scope)
    .maybeSingle<{ credits_available: number }>();

  return data?.credits_available ?? 0;
}
