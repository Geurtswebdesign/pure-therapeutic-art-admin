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
  created_at: string;
};

type ScopedTransactionRow = {
  id: string;
  user_id: string;
  credit_scope: "book" | "game" | "referral";
  delta: number;
  balance_after: number;
  reason: string;
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

type UnlockRow = {
  id: string;
  user_id: string;
  content_item_id: string;
  credits_spent: number;
  unlocked_at: string;
};

type ContentItemLookup = {
  id: string;
  title: string;
  access_scope: "assignment" | "book" | "game" | "referral";
};

type UnlockPurchaseRow = {
  id: string;
  user_id: string;
  content_item_id: string;
  credits_spent: number;
  created_at: string;
  content_title: string;
  access_scope: "assignment" | "book" | "game" | "referral";
};

type EntitlementRow = {
  id: string;
  user_id: string;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
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
    .select("id, user_id, delta, balance_after, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<TransactionRow[]>();

  const { data: scopedTransactions } = await supabase
    .from("credit_scope_transactions")
    .select("id, user_id, credit_scope, delta, balance_after, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<ScopedTransactionRow[]>();

  const { data: purchases } = await supabase
    .from("credit_pack_purchases")
    .select("id, user_id, pack_id, quantity, credits_total, amount_cents, currency, created_at")
    .order("created_at", { ascending: false })
    .returns<PurchaseRow[]>();

  const { data: unlocks } = await supabase
    .from("content_unlocks")
    .select("id, user_id, content_item_id, credits_spent, unlocked_at")
    .order("unlocked_at", { ascending: false })
    .returns<UnlockRow[]>();

  const contentIds = Array.from(
    new Set((unlocks ?? []).map((row) => row.content_item_id).filter(Boolean))
  );

  let contentLookup = new Map<string, ContentItemLookup>();
  if (contentIds.length > 0) {
    const { data: contentRows } = await supabase
      .from("content_items")
      .select("id, title, access_scope")
      .in("id", contentIds)
      .returns<ContentItemLookup[]>();

    contentLookup = new Map((contentRows ?? []).map((item) => [item.id, item]));
  }

  const unlockPurchases: UnlockPurchaseRow[] = (unlocks ?? []).map((row) => {
    const item = contentLookup.get(row.content_item_id);
    return {
      id: row.id,
      user_id: row.user_id,
      content_item_id: row.content_item_id,
      credits_spent: row.credits_spent,
      created_at: row.unlocked_at,
      content_title: item?.title ?? row.content_item_id.slice(0, 8),
      access_scope: item?.access_scope ?? "assignment",
    };
  });

  const { data: entitlements } = await supabase
    .from("user_entitlements")
    .select("id, user_id, starts_at, ends_at, created_at")
    .eq("entitlement_key", "year_assignments")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<EntitlementRow[]>();

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Administratie</h1>
        <p className="text-sm text-gray-600">
          Credits, wallets en transacties voor je unlock-business model.
        </p>
      </header>

      <AdministrationTabs />

      {activeTab === "overview" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded border bg-white p-4">
            <h2 className="text-base font-semibold">Credits</h2>
            <p className="mt-2 text-sm text-gray-600">Credit packs, pricing en toekenningen.</p>
            <Link href="/admin/administration?tab=credits" className="mt-3 inline-block text-sm text-blue-700 hover:underline">
              Open credits
            </Link>
          </article>
          <article className="rounded border bg-white p-4">
            <h2 className="text-base font-semibold">Wallets</h2>
            <p className="mt-2 text-sm text-gray-600">Wallet-overzicht per credit-scope.</p>
            <Link href="/admin/administration?tab=wallets" className="mt-3 inline-block text-sm text-blue-700 hover:underline">
              Open wallets
            </Link>
          </article>
          <article className="rounded border bg-white p-4">
            <h2 className="text-base font-semibold">Transacties</h2>
            <p className="mt-2 text-sm text-gray-600">Mutaties, purchases en jaarabonnementen.</p>
            <Link href="/admin/administration?tab=transactions" className="mt-3 inline-block text-sm text-blue-700 hover:underline">
              Open transacties
            </Link>
          </article>
        </div>
      ) : null}

      {activeTab === "credits" ? (
        <CreditPacksManager
          packs={packs ?? []}
          users={users}
          purchases={purchases ?? []}
          unlockPurchases={unlockPurchases}
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
                    <th className="px-2 py-2 text-left">User</th>
                    <th className="px-2 py-2 text-right">Beschikbaar</th>
                    <th className="px-2 py-2 text-right">Totaal gekocht</th>
                    <th className="px-2 py-2 text-left">Updated</th>
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
                    <th className="px-2 py-2 text-left">User</th>
                    <th className="px-2 py-2 text-left">Scope</th>
                    <th className="px-2 py-2 text-right">Beschikbaar</th>
                    <th className="px-2 py-2 text-right">Totaal gekocht</th>
                    <th className="px-2 py-2 text-left">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {(scopedWallets ?? []).map((wallet) => (
                    <tr key={`${wallet.user_id}-${wallet.credit_scope}`} className="border-t">
                      <td className="px-2 py-2">{wallet.user_id.slice(0, 8)}...</td>
                      <td className="px-2 py-2">{wallet.credit_scope}</td>
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
        <div className="space-y-6">
          <section className="rounded border bg-white p-4">
            <h2 className="text-base font-semibold">Transacties (opdrachten)</h2>
            <div className="mt-3 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left">Datum</th>
                    <th className="px-2 py-2 text-left">User</th>
                    <th className="px-2 py-2 text-right">Delta</th>
                    <th className="px-2 py-2 text-right">Balance after</th>
                    <th className="px-2 py-2 text-left">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(transactions ?? []).map((tx) => (
                    <tr key={tx.id} className="border-t">
                      <td className="px-2 py-2">{new Date(tx.created_at).toLocaleString("nl-NL")}</td>
                      <td className="px-2 py-2">{tx.user_id.slice(0, 8)}...</td>
                      <td className="px-2 py-2 text-right">{tx.delta}</td>
                      <td className="px-2 py-2 text-right">{tx.balance_after}</td>
                      <td className="px-2 py-2">{tx.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded border bg-white p-4">
            <h2 className="text-base font-semibold">Transacties (boek/spel/verwijs)</h2>
            <div className="mt-3 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left">Datum</th>
                    <th className="px-2 py-2 text-left">User</th>
                    <th className="px-2 py-2 text-left">Scope</th>
                    <th className="px-2 py-2 text-right">Delta</th>
                    <th className="px-2 py-2 text-right">Balance after</th>
                    <th className="px-2 py-2 text-left">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(scopedTransactions ?? []).map((tx) => (
                    <tr key={tx.id} className="border-t">
                      <td className="px-2 py-2">{new Date(tx.created_at).toLocaleString("nl-NL")}</td>
                      <td className="px-2 py-2">{tx.user_id.slice(0, 8)}...</td>
                      <td className="px-2 py-2">{tx.credit_scope}</td>
                      <td className="px-2 py-2 text-right">{tx.delta}</td>
                      <td className="px-2 py-2 text-right">{tx.balance_after}</td>
                      <td className="px-2 py-2">{tx.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded border bg-white p-4">
            <h2 className="text-base font-semibold">Actieve jaarabonnementen (opdrachten)</h2>
            <div className="mt-3 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left">User</th>
                    <th className="px-2 py-2 text-left">Start</th>
                    <th className="px-2 py-2 text-left">Einde</th>
                    <th className="px-2 py-2 text-left">Aangemaakt</th>
                  </tr>
                </thead>
                <tbody>
                  {(entitlements ?? []).map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-2 py-2">{row.user_id.slice(0, 8)}...</td>
                      <td className="px-2 py-2">{new Date(row.starts_at).toLocaleDateString("nl-NL")}</td>
                      <td className="px-2 py-2">{row.ends_at ? new Date(row.ends_at).toLocaleDateString("nl-NL") : "onbepaald"}</td>
                      <td className="px-2 py-2">{new Date(row.created_at).toLocaleString("nl-NL")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
