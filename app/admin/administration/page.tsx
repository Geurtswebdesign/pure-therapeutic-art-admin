import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import AdministrationTabs from "@/components/admin/administration/AdministrationTabs";
import CreditPacksManager from "@/components/admin/administration/CreditPacksManager";

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
  pack_id: string;
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

function scopeLabel(scope: CombinedTransactionRow["scope"] | ScopedWalletRow["credit_scope"]) {
  if (scope === "assignment") return "opdrachten";
  if (scope === "book") return "boeken";
  if (scope === "game") return "spellen";
  return "verwijsbestanden";
}

export default async function AdministrationPage({ searchParams }: PageProps) {
  const supabase = createAdminClient();
  const { tab } = await searchParams;
  const activeTab = tab ?? "overview";

  const { data: packs } = await supabase
    .from("credit_packs")
    .select("id, slug, name, credit_scope, credits_base, bonus_credits, price_cents, currency, is_active, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<CreditPack[]>();

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
      amount: tx.ref_id ? purchaseAmountById.get(tx.ref_id) ?? "—" : "—",
    }))),
    ...((scopedTransactions ?? []).map((tx) => ({
      id: tx.id,
      created_at: tx.created_at,
      user_id: tx.user_id,
      type: "scoped_pack" as const,
      scope: tx.credit_scope,
      delta: tx.delta,
      reason: tx.reason,
      amount: tx.ref_id ? purchaseAmountById.get(tx.ref_id) ?? "—" : "—",
    }))),
    ...((entitlements ?? []).map((row) => {
      const now = new Date();
      const start = new Date(row.starts_at);
      const end = row.ends_at ? new Date(row.ends_at) : null;
      const status = !row.is_active
        ? "beëindigd"
        : start > now
          ? "gepland"
          : end && end <= now
            ? "verlopen"
            : "actief";

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
            : "—",
      };
    })),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Administratie</h1>
        <p className="text-sm text-gray-600">
          Credits, wallets en transacties voor je ontgrendel-businessmodel.
        </p>
      </header>

      <AdministrationTabs />

      {activeTab === "overview" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded border bg-white p-4">
            <h2 className="text-base font-semibold">Credits</h2>
            <p className="mt-2 text-sm text-gray-600">Creditpacks, prijzen en toekenningen.</p>
            <Link href="/admin/administration?tab=credits" className="mt-3 inline-block text-sm text-blue-700 hover:underline">
              Ga naar credits
            </Link>
          </article>
          <article className="rounded border bg-white p-4">
            <h2 className="text-base font-semibold">Wallets</h2>
            <p className="mt-2 text-sm text-gray-600">Wallet-overzicht per credit-scope.</p>
            <Link href="/admin/administration?tab=wallets" className="mt-3 inline-block text-sm text-blue-700 hover:underline">
              Ga naar wallets
            </Link>
          </article>
          <article className="rounded border bg-white p-4">
            <h2 className="text-base font-semibold">Transacties</h2>
            <p className="mt-2 text-sm text-gray-600">Mutaties, aankopen en jaarabonnementen.</p>
            <Link href="/admin/administration?tab=transactions" className="mt-3 inline-block text-sm text-blue-700 hover:underline">
              Ga naar transacties
            </Link>
          </article>
        </div>
      ) : null}

      {activeTab === "credits" ? (
        <CreditPacksManager
          packs={packs ?? []}
          users={users}
        />
      ) : null}

      {activeTab === "wallets" ? (
        <div className="space-y-6">
          <section className="rounded border bg-white p-4">
            <h2 className="text-base font-semibold">Wallets (opdrachten)</h2>
            <div className="mt-3 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left">Gebruiker</th>
                    <th className="px-2 py-2 text-right">Beschikbaar</th>
                    <th className="px-2 py-2 text-right">Totaal gekocht</th>
                    <th className="px-2 py-2 text-left">Bijgewerkt</th>
                  </tr>
                </thead>
                <tbody>
                  {(wallets ?? []).map((wallet) => (
                    <tr key={wallet.user_id} className="border-t">
                      <td className="px-2 py-2">{wallet.user_id.slice(0, 8)}...</td>
                      <td className="px-2 py-2 text-right">{wallet.credits_available}</td>
                      <td className="px-2 py-2 text-right">{wallet.credits_total_purchased}</td>
                      <td className="px-2 py-2">{new Date(wallet.updated_at).toLocaleString("nl-NL")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded border bg-white p-4">
            <h2 className="text-base font-semibold">Wallets (boek/spel/verwijs)</h2>
            <div className="mt-3 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left">Gebruiker</th>
                    <th className="px-2 py-2 text-left">Type</th>
                    <th className="px-2 py-2 text-right">Beschikbaar</th>
                    <th className="px-2 py-2 text-right">Totaal gekocht</th>
                    <th className="px-2 py-2 text-left">Bijgewerkt</th>
                  </tr>
                </thead>
                <tbody>
                  {(scopedWallets ?? []).map((wallet) => (
                    <tr key={`${wallet.user_id}-${wallet.credit_scope}`} className="border-t">
                      <td className="px-2 py-2">{wallet.user_id.slice(0, 8)}...</td>
                      <td className="px-2 py-2">{scopeLabel(wallet.credit_scope)}</td>
                      <td className="px-2 py-2 text-right">{wallet.credits_available}</td>
                      <td className="px-2 py-2 text-right">{wallet.credits_total_purchased}</td>
                      <td className="px-2 py-2">{new Date(wallet.updated_at).toLocaleString("nl-NL")}</td>
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
          <h2 className="text-base font-semibold">Transactieoverzicht (alle aankopen)</h2>
          <div className="mt-3 overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left">Datum</th>
                  <th className="px-2 py-2 text-left">Gebruiker</th>
                  <th className="px-2 py-2 text-left">Type</th>
                  <th className="px-2 py-2 text-left">Type credits</th>
                  <th className="px-2 py-2 text-right">Delta</th>
                  <th className="px-2 py-2 text-left">Reden</th>
                  <th className="px-2 py-2 text-right">Aankoopkosten</th>
                </tr>
              </thead>
              <tbody>
                {combinedTransactions.map((row) => (
                  <tr key={`${row.type}-${row.id}`} className="border-t">
                    <td className="px-2 py-2">{new Date(row.created_at).toLocaleString("nl-NL")}</td>
                    <td className="px-2 py-2">{row.user_id.slice(0, 8)}...</td>
                    <td className="px-2 py-2">
                      {row.type === "assignment_pack"
                        ? "creditpack"
                        : row.type === "scoped_pack"
                          ? "creditpack (specifiek)"
                          : "jaarabonnement"}
                    </td>
                    <td className="px-2 py-2">{scopeLabel(row.scope)}</td>
                    <td className="px-2 py-2 text-right">{row.delta ?? "—"}</td>
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
