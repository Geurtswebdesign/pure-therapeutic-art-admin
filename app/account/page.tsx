import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreditTransaction, CreditWallet } from "@/lib/credits/types";
import AccountTabs from "@/components/account/AccountTabs";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  role: string | null;
  profile_data?: {
    bio?: string | null;
  } | null;
};

type UnlockedItem = {
  id: string;
  title: string;
  slug: string | null;
  content_categories?: { name: string }[] | null;
};

export default async function AccountPage() {
  const language = resolveUiLanguage(await getPrimaryLanguage());
  const t = getAppMessages(language).accountPage;

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/account");
  }

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, display_name, role, profile_data")
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();

  const { data: wallet } = await supabase
    .from("credit_wallets")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<CreditWallet>();

  const { data: transactions } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<CreditTransaction[]>();

  const { data: unlocks } = await supabase
    .from("content_unlocks")
    .select("id, credits_spent, unlocked_at, content_item_id")
    .eq("user_id", user.id)
    .order("unlocked_at", { ascending: false });

  const contentIds = Array.from(
    new Set((unlocks ?? []).map((u) => u.content_item_id).filter(Boolean))
  );

  let unlockedItems: UnlockedItem[] = [];
  if (contentIds.length) {
    const { data } = await supabase
      .from("content_items")
      .select("id, title, slug, content_categories(name)")
      .in("id", contentIds);

    unlockedItems = (data ?? []) as UnlockedItem[];
  }

  const itemById = new Map(unlockedItems.map((item) => [item.id, item]));

  const unlockedContent = (unlocks ?? []).map((unlock) => ({
    id: unlock.id,
    credits_spent: unlock.credits_spent,
    unlocked_at: unlock.unlocked_at,
    content_item: unlock.content_item_id
      ? (() => {
          const item = itemById.get(unlock.content_item_id);
          if (!item) return null;
          return {
            title: item.title,
            slug: item.slug,
            categories: item.content_categories?.map((c) => c.name) ?? [],
          };
        })()
      : null,
  }));

  const safeWallet: CreditWallet = wallet ?? {
    user_id: user.id,
    credits_available: 0,
    credits_total_purchased: 0,
    updated_at: new Date().toISOString(),
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <header className="rounded border bg-white p-4">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-gray-600">
          {t.subtitle}
        </p>
      </header>

      <AccountTabs
        role={profile?.role ?? "user"}
        displayName={profile?.display_name ?? ""}
        email={user.email ?? ""}
        bio={profile?.profile_data?.bio ?? ""}
        wallet={safeWallet}
        transactions={transactions ?? []}
        unlockedContent={unlockedContent}
        language={language}
      />
    </main>
  );
}
