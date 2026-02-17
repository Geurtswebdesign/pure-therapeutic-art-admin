import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { getAdminUser } from "@/lib/auth/getAdminUser";

import {
  CreditWallet,
  CreditTransaction,
} from "@/lib/credits/types";
import {AdminUserProfile} from "@/lib/users/getUserDetail";
import UserHeader from "@/components/users/UserHeader";
import UserTabs from "@/components/users/UserTabs";

type PageProps = {
  params: Promise<{
    user_id: string;
  }>;
};

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { user_id } = await params;

  /* =========================
     1. Admin authorisatie
     ========================= */
  const adminUser = await getAdminUser();
  if (!adminUser) redirect("/unauthorized");

  const supabase = createAdminClient();

  /* =========================
     2. Profiel
     ========================= */
  const { data: user, error: userError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle<AdminUserProfile>();

  if (userError || !user) {
    throw new Error("Profiel bestaat niet");
  }

  /* =========================
     3. Wallet
     ========================= */
  const { data: wallet, error: walletError } = await supabase
    .from("credit_wallets")
    .select("*")
    .eq("user_id", user_id)
    .single<CreditWallet>();

  if (walletError || !wallet) {
    throw new Error("Credit wallet bestaat niet");
  }

  /* =========================
     4. Transacties
     ========================= */
  const { data: transactions } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<CreditTransaction[]>();

  /* =========================
     5. Render
     ========================= */
  return (
    <div className="space-y-8">
      <UserHeader user={user} />

      <UserTabs
        user={user}
        wallet={wallet}
        transactions={transactions ?? []}
        currentAdminId={adminUser.id}
        isSuperAdmin={adminUser.isSuperAdmin}   // ⬅️ MOET ERIN
      />
    </div>
  );
}
