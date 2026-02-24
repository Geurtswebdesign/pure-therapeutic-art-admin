import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth/getAdminUser";

import {
  CreditWallet,
  CreditTransaction,
} from "@/lib/credits/types";
import {AdminUserProfile} from "@/lib/users/getUserDetail";
import UserHeader from "@/components/users/UserHeader";
import UserTabs from "@/components/users/UserTabs";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

type PageProps = {
  params: Promise<{
    user_id: string;
  }>;
};

type YearEntitlement = {
  id: string;
  entitlement_key: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
};

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { user_id } = await params;
  const language = resolveUiLanguage(await getPrimaryLanguage());

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
    .maybeSingle<CreditWallet>();

  if (walletError) {
    throw new Error("Credit wallet ophalen mislukt");
  }

  let ensuredWallet = wallet;

  if (!ensuredWallet) {
    const { data: insertedWallet, error: insertWalletError } = await supabase
      .from("credit_wallets")
      .insert({
        user_id,
        credits_available: 0,
        credits_total_purchased: 0,
      })
      .select("*")
      .single<CreditWallet>();

    if (insertWalletError || !insertedWallet) {
      throw new Error("Credit wallet aanmaken mislukt");
    }

    ensuredWallet = insertedWallet;
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
     5. Content Unlocks
     ========================= */  
  const { data: unlockedContent } = await supabase
    .from("content_unlocks")
    .select(`
      id,
      credits_spent,
      unlocked_at,
      content_item_id
    `)
    .eq("user_id", user_id)
    .order("unlocked_at", { ascending: false });

  const contentIds = Array.from(
    new Set((unlockedContent ?? []).map((u) => u.content_item_id).filter(Boolean))
  );

  type UnlockedItem = {
    id: string;
    title: string;
    slug: string;
    credit_cost: number;
    content_categories?: { name: string }[] | null;
  };

  let unlockedItems: UnlockedItem[] = [];

  if (contentIds.length) {
    const { data: withCategories, error: withCategoriesError } = await supabase
      .from("content_items")
      .select("id, title, slug, credit_cost, content_categories(name)")
      .in("id", contentIds);

    if (withCategoriesError) {
      const { data: baseItems } = await supabase
        .from("content_items")
        .select("id, title, slug, credit_cost")
        .in("id", contentIds);
      unlockedItems = (baseItems ?? []) as UnlockedItem[];
    } else {
      unlockedItems = (withCategories ?? []) as UnlockedItem[];
    }
  }

  const itemById = new Map((unlockedItems ?? []).map((item) => [item.id, item]));

  const unlockedContentWithItem = (unlockedContent ?? []).map((unlock) => ({
    id: unlock.id,
    credits_spent: unlock.credits_spent,
    unlocked_at: unlock.unlocked_at,
    content_item: unlock.content_item_id
      ? (() => {
          const item = itemById.get(unlock.content_item_id);
          if (!item) return null;
          return {
            id: item.id,
            title: item.title,
            slug: item.slug,
            credit_cost: item.credit_cost,
            categories: item.content_categories?.map((c) => c.name) ?? [],
          };
        })()
      : null,
  }));

  const { data: yearEntitlements } = await supabase
    .from("user_entitlements")
    .select("id, entitlement_key, starts_at, ends_at, is_active, created_at")
    .eq("user_id", user_id)
    .eq("entitlement_key", "year_assignments")
    .order("created_at", { ascending: false })
    .returns<YearEntitlement[]>();

  /* =========================
     6. Render
     ========================= */
  return (
    <div className="space-y-8">
      <UserHeader user={user} language={language} />

      <UserTabs
        language={language}
        user={user}
        wallet={ensuredWallet}
        transactions={transactions ?? []}
        unlockedContent={unlockedContentWithItem}
        yearEntitlements={yearEntitlements ?? []}
        currentAdminId={adminUser.id}
        isSuperAdmin={adminUser.isSuperAdmin}   // ⬅️ MOET ERIN
      />
    </div>
  );
}
