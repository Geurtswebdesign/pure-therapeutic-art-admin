import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import AdministrationTabs from "@/components/admin/administration/AdministrationTabs";
import CreditPacksManager from "@/components/admin/administration/CreditPacksManager";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getDeletedCreditPackIds } from "@/lib/credits/deletedPacks";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

type CreditPack = {
  id: string;
  slug: string;
  name: string;
  credit_scope: "assignment" | "book" | "game" | "referral";
  credits_base: number;
  bonus_credits: number;
  price_cents: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
};

type WalletRow = {
  user_id: string;
  credits_available: number;
  credits_total_purchased: number;
  updated_at: string;
};

type ScopedWalletRow = {
  user_id: string;
  credit_scope: "book" | "game" | "referral";
  credits_available: number;
  credits_total_purchased: number;
  updated_at: string;
};

type TransactionRow = {
  id: string;
  user_id: string;
  delta: number;
  balance_after: number;
  reason: string;
  ref_id?: string | null;
  created_at: string;
};

type ScopedTransactionRow = {
  id: string;
  user_id: string;
  credit_scope: "book" | "game" | "referral";
  delta: number;
  balance_after: number;
  reason: string;
  ref_id?: string | null;
  created_at: string;
};

type PurchaseRow = {
  id: string;
  user_id: string;
  pack_id: string | null;
  quantity: number;
  credits_total: number;
  amount_cents: number;
  currency: string;
  created_at: string;
};

type EntitlementRow = {
  id: string;
  user_id: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  metadata?: {
    amount_cents?: number;
    currency?: string;
  } | null;
};

type CombinedTransactionRow = {
  id: string;
  created_at: string;
  user_id: string;
  type: "assignment_pack" | "scoped_pack" | "year_subscription";
  scope: "assignment" | "book" | "game" | "referral";
  delta: number | null;
  reason: string;
  amount: string;
};

type UserOption = {
  user_id: string;
  email: string | null;
  display_name: string | null;
};

type AdminUserRpcRow = {
  id: string;
  email: string | null;
  display_name: string | null;
};

function scopeLabel(
  scope: CombinedTransactionRow["scope"] | ScopedWalletRow["credit_scope"],
  labels: ReturnType<typeof getAdminMessages>["administrationPage"]
) {
  if (scope === "assignment") return labels.scopeAssignment;
  if (scope === "book") return labels.scopeBook;
  if (scope === "game") return labels.scopeGame;
  return labels.scopeReferral;
}

export default async function AdministrationPage({ searchParams }: PageProps) {
  const supabase = createAdminClient();
  const [primaryLanguageValue, deletedPackIds] = await Promise.all([
    getPrimaryLanguage(),
    getDeletedCreditPackIds(),
  ]);
  const primaryLanguage = resolveUiLanguage(primaryLanguageValue);
  const t = getAdminMessages(primaryLanguage).administrationPage;
  const locale = primaryLanguage === "en" ? "en-US" : primaryLanguage === "de" ? "de-DE" : "nl-NL";
  const { tab } = await searchParams;
  const activeTab = tab ?? "overview";

  const { data: packs } = await supabase
    .from("credit_packs")
    .select("id, slug, name, credit_scope, credits_base, bonus_credits, price_cents, currency, is_active, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<CreditPack[]>();
  const visiblePacks = (packs ?? []).filter(
    (pack) => !deletedPackIds.includes(pack.id)
  );

  let users: UserOption[] = [];
  const { data: usersRpc, error: usersRpcError } = await supabase
    .rpc("get_admin_users")
    .returns<AdminUserRpcRow[]>();

  if (!usersRpcError && Array.isArray(usersRpc)) {
    users = usersRpc.map((row) => ({
      user_id: row.id,
      email: row.email,
      display_name: row.display_name,
    }));
  } else {
    const { data: profileUsers } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .order("updated_at", { ascending: false })
      .limit(300)
      .returns<{ user_id: string; display_name: string | null }[]>();

    users = (profileUsers ?? []).map((row) => ({
      user_id: row.user_id,
      email: null,
      display_name: row.display_name,
    }));
  }

  const { data: wallets } = await supabase
    .from("credit_wallets")
    .select("user_id, credits_available, credits_total_purchased, updated_at")
    .order("credits_available", { ascending: false })
    .limit(100)
    .returns<WalletRow[]>();

  const { data: scopedWallets } = await supabase
    .from("user_credit_scopes")
    .select("user_id, credit_scope, credits_available, credits_total_purchased, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100)
    .returns<ScopedWalletRow[]>();

  const { data: transactions } = await supabase
    .from("credit_transactions")
    .select("id, user_id, delta, balance_after, reason, ref_id, created_at")
    .eq("reason", "pack_purchase")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<TransactionRow[]>();

  const { data: scopedTransactions } = await supabase
    .from("credit_scope_transactions")
    .select("id, user_id, credit_scope, delta, balance_after, reason, ref_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<ScopedTransactionRow[]>();

  const { data: purchases } = await supabase
    .from("credit_pack_purchases")
    .select("id, user_id, pack_id, quantity, credits_total, amount_cents, currency, created_at")
    .order("created_at", { ascending: false })
    .returns<PurchaseRow[]>();

  const purchaseAmountById = new Map(
    (purchases ?? []).map((row) => [
      row.id,
      `${(row.amount_cents / 100).toFixed(2)} ${row.currency}`,
    ])
  );

  const { data: entitlements } = await supabase
    .from("user_entitlements")
    .select("id, user_id, is_active, starts_at, ends_at, created_at, metadata")
    .eq("entitlement_key", "year_assignments")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<EntitlementRow[]>();

  const combinedTransactions: CombinedTransactionRow[] = [
    ...((transactions ?? []).map((tx) => ({
      id: tx.id,
      created_at: tx.created_at,
      user_id: tx.user_id,
      type: "assignment_pack" as const,
      scope: "assignment" as const,
      delta: tx.delta,
      reason: tx.reason,
      amount: tx.ref_id ? purchaseAmountById.get(tx.ref_id) ?? t.noAmount : t.noAmount,
    }))),
    ...((scopedTransactions ?? []).map((tx) => ({
      id: tx.id,
      created_at: tx.created_at,
      user_id: tx.user_id,
      type: "scoped_pack" as const,
      scope: tx.credit_scope,
      delta: tx.delta,
      reason: tx.reason,
      amount: tx.ref_id ? purchaseAmountById.get(tx.ref_id) ?? t.noAmount : t.noAmount,
    }))),
    ...((entitlements ?? []).map((row) => {
      const now = new Date();
      const start = new Date(row.starts_at);
      const end = row.ends_at ? new Date(row.ends_at) : null;
      const status = !row.is_active
        ? t.statusEnded
        : start > now
          ? t.statusPlanned
          : end && end <= now
            ? t.statusExpired
            : t.statusActive;

      return {
        id: row.id,
        created_at: row.created_at,
        user_id: row.user_id,
        type: "year_subscription" as const,
        scope: "assignment" as const,
        delta: null,
        reason: `year_assignments:${status}`,
        amount:
          typeof row.metadata?.amount_cents === "number"
            ? `${(row.metadata.amount_cents / 100).toFixed(2)} ${row.metadata?.currency ?? "EUR"}`
            : t.noAmount,
      };
    })),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-gray-600">{t.subtitle}</p>
      </header>

      <AdministrationTabs language={primaryLanguage} />

      {activeTab === "overview" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded border bg-white p-4">
            <h2 className="text-base font-semibold">{t.overviewCreditsTitle}</h2>
            <p className="mt-2 text-sm text-gray-600">{t.overviewCreditsDesc}</p>
            <Link href="/admin/administration?tab=credits" className="mt-3 inline-block text-sm text-blue-700 hover:underline">
              {t.overviewCreditsLink}
            </Link>
          </article>
          <article className="rounded border bg-white p-4">
            <h2 className="text-base font-semibold">{t.overviewWalletsTitle}</h2>
            <p className="mt-2 text-sm text-gray-600">{t.overviewWalletsDesc}</p>
            <Link href="/admin/administration?tab=wallets" className="mt-3 inline-block text-sm text-blue-700 hover:underline">
              {t.overviewWalletsLink}
            </Link>
          </article>
          <article className="rounded border bg-white p-4">
            <h2 className="text-base font-semibold">{t.overviewTransactionsTitle}</h2>
            <p className="mt-2 text-sm text-gray-600">{t.overviewTransactionsDesc}</p>
            <Link href="/admin/administration?tab=transactions" className="mt-3 inline-block text-sm text-blue-700 hover:underline">
              {t.overviewTransactionsLink}
            </Link>
          </article>
        </div>
      ) : null}

      {activeTab === "credits" ? (
        <CreditPacksManager
          packs={visiblePacks}
          users={users}
          language={primaryLanguage}
        />
      ) : null}

      {activeTab === "wallets" ? (
        <div className="space-y-6">
          <section className="rounded border bg-white p-4">
            <h2 className="text-base font-semibold">{t.walletsAssignmentsTitle}</h2>
            <div className="mt-3 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left">{t.user}</th>
                    <th className="px-2 py-2 text-right">{t.available}</th>
                    <th className="px-2 py-2 text-right">{t.totalPurchased}</th>
                    <th className="px-2 py-2 text-left">{t.updated}</th>
                  </tr>
                </thead>
                <tbody>
                  {(wallets ?? []).map((wallet) => (
                    <tr key={wallet.user_id} className="border-t">
                      <td className="px-2 py-2">{wallet.user_id.slice(0, 8)}...</td>
                      <td className="px-2 py-2 text-right">{wallet.credits_available}</td>
                      <td className="px-2 py-2 text-right">{wallet.credits_total_purchased}</td>
                      <td className="px-2 py-2">{new Date(wallet.updated_at).toLocaleString(locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded border bg-white p-4">
            <h2 className="text-base font-semibold">{t.walletsScopedTitle}</h2>
            <div className="mt-3 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left">{t.user}</th>
                    <th className="px-2 py-2 text-left">{t.type}</th>
                    <th className="px-2 py-2 text-right">{t.available}</th>
                    <th className="px-2 py-2 text-right">{t.totalPurchased}</th>
                    <th className="px-2 py-2 text-left">{t.updated}</th>
                  </tr>
                </thead>
                <tbody>
                  {(scopedWallets ?? []).map((wallet) => (
                    <tr key={`${wallet.user_id}-${wallet.credit_scope}`} className="border-t">
                      <td className="px-2 py-2">{wallet.user_id.slice(0, 8)}...</td>
                      <td className="px-2 py-2">{scopeLabel(wallet.credit_scope, t)}</td>
                      <td className="px-2 py-2 text-right">{wallet.credits_available}</td>
                      <td className="px-2 py-2 text-right">{wallet.credits_total_purchased}</td>
                      <td className="px-2 py-2">{new Date(wallet.updated_at).toLocaleString(locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "transactions" ? (
        <section className="rounded border bg-white p-4">
          <h2 className="text-base font-semibold">{t.transactionOverviewTitle}</h2>
          <div className="mt-3 overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left">{t.date}</th>
                  <th className="px-2 py-2 text-left">{t.user}</th>
                  <th className="px-2 py-2 text-left">{t.type}</th>
                  <th className="px-2 py-2 text-left">{t.creditType}</th>
                  <th className="px-2 py-2 text-right">{t.delta}</th>
                  <th className="px-2 py-2 text-left">{t.reason}</th>
                  <th className="px-2 py-2 text-right">{t.purchaseAmount}</th>
                </tr>
              </thead>
              <tbody>
                {combinedTransactions.map((row) => (
                  <tr key={`${row.type}-${row.id}`} className="border-t">
                    <td className="px-2 py-2">{new Date(row.created_at).toLocaleString(locale)}</td>
                    <td className="px-2 py-2">{row.user_id.slice(0, 8)}...</td>
                    <td className="px-2 py-2">
                      {row.type === "assignment_pack"
                        ? t.assignmentPack
                        : row.type === "scoped_pack"
                          ? t.scopedPack
                          : t.yearSubscription}
                    </td>
                    <td className="px-2 py-2">{scopeLabel(row.scope, t)}</td>
                    <td className="px-2 py-2 text-right">{row.delta ?? t.noAmount}</td>
                    <td className="px-2 py-2">{row.reason}</td>
                    <td className="px-2 py-2 text-right">{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </section>
  );
}
