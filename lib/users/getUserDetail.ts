"use server";

import { requireAdmin } from "@/lib/auth";
import { getWallet } from "@/lib/credits/getWallet";
import { getTransactions } from "@/lib/credits/getTransactions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppProfileData } from "@/lib/users/accountTypes";

export type AdminUserProfile = {
  user_id: string;
  email?: string | null;   // 👈 optioneel
  display_name: string | null;
  role: "user" | "admin";
  profile_data?: AppProfileData | null;
  bio?: string | null;
  created_at?: string | null;
};

export async function getUserDetail(
  userId: string
) {
  await requireAdmin();

  const supabase = createAdminClient();

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("user_id, display_name, role")
    .eq("user_id", userId)
    .single();

  if (!profileRow) return null;

  const profile: AdminUserProfile = {
    user_id: profileRow.user_id,
    display_name: profileRow.display_name,
    role: profileRow.role,
  };

  const wallet = await getWallet(userId);

  const transactions = await getTransactions(userId);

  return {
    profile,
    wallet,
    transactions,
  };
}
