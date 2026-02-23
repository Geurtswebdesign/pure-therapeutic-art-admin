"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCreditPack,
  grantYearAssignmentsAccess,
  purchaseCreditPack,
  setCreditPackActive,
  updateCreditPack,
} from "@/app/admin/administration/actions";

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

type UserOption = {
  user_id: string;
  email: string | null;
  display_name: string | null;
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

type UnlockPurchaseRow = {
  id: string;
  user_id: string;
  content_item_id: string;
  credits_spent: number;
  created_at: string;
  content_title: string;
  access_scope: "assignment" | "book" | "game" | "referral";
};

type PackFormState = {
  slug: string;
  name: string;
  credit_scope: "assignment" | "book" | "game" | "referral";
  credits_base: number;
  bonus_credits: number;
  price_cents: number;
  currency: string;
  sort_order: number;
  is_active: boolean;
};

const EMPTY_PACK_FORM: PackFormState = {
  slug: "",
  name: "",
  credit_scope: "assignment",
  credits_base: 10,
  bonus_credits: 0,
  price_cents: 1000,
  currency: "EUR",
  sort_order: 0,
  is_active: true,
};

export default function CreditPacksManager({
  packs,
  users,
  purchases,
  unlockPurchases,
}: {
  packs: CreditPack[];
  users: UserOption[];
  purchases: PurchaseRow[];
  unlockPurchases: UnlockPurchaseRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingPackId, setEditingPackId] = useState<string | null>(null);
  const [packForm, setPackForm] = useState<PackFormState>(EMPTY_PACK_FORM);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [purchaseUserId, setPurchaseUserId] = useState<string>("");
  const [purchasePackId, setPurchasePackId] = useState<string>("");
  const [purchaseQty, setPurchaseQty] = useState<number>(1);
  const [purchaseNote, setPurchaseNote] = useState("");
  const [entitlementUserId, setEntitlementUserId] = useState<string>("");
  const [entitlementMonths, setEntitlementMonths] = useState<number>(12);
  const [entitlementNote, setEntitlementNote] = useState("");

  const packNameById = useMemo(
    () => new Map(packs.map((pack) => [pack.id, pack.name])),
    [packs]
  );
  const userLabelById = useMemo(
    () =>
      new Map(
        users.map((user) => [
          user.user_id,
          user.display_name || user.email || `${user.user_id.slice(0, 8)}...`,
        ])
      ),
    [users]
  );
  const allPurchaseEvents = useMemo(() => {
    const packEvents = purchases.map((row) => ({
      id: `pack:${row.id}`,
      kind: "pack" as const,
      created_at: row.created_at,
      user_id: row.user_id,
      label: packNameById.get(row.pack_id) ?? row.pack_id.slice(0, 8),
      scope: "n.v.t.",
      qty: row.quantity,
      credits: row.credits_total,
      amount: `${(row.amount_cents / 100).toFixed(2)} ${row.currency}`,
    }));

    const unlockEvents = unlockPurchases.map((row) => ({
      id: `unlock:${row.id}`,
      kind: "unlock" as const,
      created_at: row.created_at,
      user_id: row.user_id,
      label: row.content_title,
      scope: row.access_scope,
      qty: 1,
      credits: row.credits_spent,
      amount: "—",
    }));

    return [...packEvents, ...unlockEvents].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [purchases, unlockPurchases, packNameById]);

  function fillEdit(pack: CreditPack) {
    setEditingPackId(pack.id);
    setPackForm({
      slug: pack.slug,
      name: pack.name,
      credit_scope: pack.credit_scope,
      credits_base: pack.credits_base,
      bonus_credits: pack.bonus_credits,
      price_cents: pack.price_cents,
      currency: pack.currency,
      sort_order: pack.sort_order,
      is_active: pack.is_active,
    });
  }

  function resetPackForm() {
    setEditingPackId(null);
    setPackForm(EMPTY_PACK_FORM);
  }

  function submitPackForm(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        if (editingPackId) {
          await updateCreditPack(editingPackId, packForm);
          setMessage("Credit pack bijgewerkt.");
        } else {
          await createCreditPack(packForm);
          setMessage("Credit pack aangemaakt.");
        }
        resetPackForm();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Opslaan mislukt.");
      }
    });
  }

  function togglePack(packId: string, nextActive: boolean) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await setCreditPackActive(packId, nextActive);
        setMessage(nextActive ? "Pack geactiveerd." : "Pack gedeactiveerd.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Status wijzigen mislukt.");
      }
    });
  }

  function submitPurchase(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        await purchaseCreditPack({
          userId: purchaseUserId,
          packId: purchasePackId,
          quantity: purchaseQty,
          note: purchaseNote,
        });
        setMessage("Pack purchase verwerkt.");
        setPurchaseQty(1);
        setPurchaseNote("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Purchase mislukt.");
      }
    });
  }

  function submitEntitlement(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        await grantYearAssignmentsAccess({
          userId: entitlementUserId,
          months: entitlementMonths,
          note: entitlementNote,
        });
        setMessage("Jaarabonnement (opdrachten) toegekend.");
        setEntitlementNote("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Toekennen mislukt.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded border bg-white p-4">
        <h2 className="text-base font-semibold">
          {editingPackId ? "Credit pack bewerken" : "Nieuw credit pack"}
        </h2>

        <form onSubmit={submitPackForm} className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-sm text-gray-600">Slug</span>
            <input
              value={packForm.slug}
              onChange={(e) => setPackForm((s) => ({ ...s, slug: e.target.value }))}
              className="w-full rounded border px-2 py-1.5 text-sm"
              required
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-gray-600">Naam</span>
            <input
              value={packForm.name}
              onChange={(e) => setPackForm((s) => ({ ...s, name: e.target.value }))}
              className="w-full rounded border px-2 py-1.5 text-sm"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-600">Credit scope</span>
            <select
              value={packForm.credit_scope}
              onChange={(e) =>
                setPackForm((s) => ({
                  ...s,
                  credit_scope: e.target.value as PackFormState["credit_scope"],
                }))
              }
              className="w-full rounded border px-2 py-1.5 text-sm"
            >
              <option value="assignment">Opdrachten</option>
              <option value="book">Boeken</option>
              <option value="game">Spellen</option>
              <option value="referral">Verwijsbestanden</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-gray-600">Base credits</span>
            <input
              type="number"
              min={1}
              value={packForm.credits_base}
              onChange={(e) => setPackForm((s) => ({ ...s, credits_base: Number(e.target.value) }))}
              className="w-full rounded border px-2 py-1.5 text-sm"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-600">Bonus credits</span>
            <input
              type="number"
              min={0}
              value={packForm.bonus_credits}
              onChange={(e) => setPackForm((s) => ({ ...s, bonus_credits: Number(e.target.value) }))}
              className="w-full rounded border px-2 py-1.5 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-600">Prijs (cents)</span>
            <input
              type="number"
              min={0}
              value={packForm.price_cents}
              onChange={(e) => setPackForm((s) => ({ ...s, price_cents: Number(e.target.value) }))}
              className="w-full rounded border px-2 py-1.5 text-sm"
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-gray-600">Currency</span>
            <input
              value={packForm.currency}
              onChange={(e) => setPackForm((s) => ({ ...s, currency: e.target.value.toUpperCase() }))}
              className="w-full rounded border px-2 py-1.5 text-sm"
              required
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-600">Sort order</span>
            <input
              type="number"
              value={packForm.sort_order}
              onChange={(e) => setPackForm((s) => ({ ...s, sort_order: Number(e.target.value) }))}
              className="w-full rounded border px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 pt-6 text-sm">
            <input
              type="checkbox"
              checked={packForm.is_active}
              onChange={(e) => setPackForm((s) => ({ ...s, is_active: e.target.checked }))}
            />
            Active
          </label>

          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-60"
            >
              {isPending ? "Opslaan..." : editingPackId ? "Pack bijwerken" : "Pack aanmaken"}
            </button>
            {editingPackId ? (
              <button
                type="button"
                onClick={resetPackForm}
                className="rounded border px-3 py-1.5 text-sm"
              >
                Annuleren
              </button>
            ) : null}
          </div>
        </form>

        {message ? <p className="mt-3 text-sm text-green-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="text-base font-semibold">Packs</h2>
        <div className="mt-3 overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left">Naam</th>
                <th className="px-2 py-2 text-left">Slug</th>
                <th className="px-2 py-2 text-left">Scope</th>
                <th className="px-2 py-2 text-right">Credits</th>
                <th className="px-2 py-2 text-right">Prijs</th>
                <th className="px-2 py-2 text-left">Status</th>
                <th className="px-2 py-2 text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {packs.map((pack) => {
                const total = pack.credits_base + pack.bonus_credits;
                return (
                  <tr key={pack.id} className="border-t">
                    <td className="px-2 py-2">{pack.name}</td>
                    <td className="px-2 py-2 text-gray-600">{pack.slug}</td>
                    <td className="px-2 py-2">{pack.credit_scope}</td>
                    <td className="px-2 py-2 text-right">{total}</td>
                    <td className="px-2 py-2 text-right">
                      {(pack.price_cents / 100).toFixed(2)} {pack.currency}
                    </td>
                    <td className="px-2 py-2">
                      {pack.is_active ? "Active" : "Inactive"}
                    </td>
                    <td className="px-2 py-2 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => fillEdit(pack)}
                        className="rounded border px-2 py-1 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePack(pack.id, !pack.is_active)}
                        className="rounded border px-2 py-1 text-xs"
                      >
                        {pack.is_active ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {packs.length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-center text-gray-500" colSpan={7}>
                    Geen packs gevonden.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded border bg-white p-4 space-y-4">
        <h2 className="text-base font-semibold">Pack toekennen aan gebruiker</h2>
        <form onSubmit={submitPurchase} className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-gray-600">Gebruiker</span>
            <select
              value={purchaseUserId}
              onChange={(e) => setPurchaseUserId(e.target.value)}
              className="w-full rounded border px-2 py-1.5 text-sm"
              required
            >
              <option value="">Selecteer gebruiker</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {(user.display_name || user.email || user.user_id) + ` (${user.user_id.slice(0, 8)})`}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-gray-600">Pack</span>
            <select
              value={purchasePackId}
              onChange={(e) => setPurchasePackId(e.target.value)}
              className="w-full rounded border px-2 py-1.5 text-sm"
              required
            >
              <option value="">Selecteer pack</option>
              {packs.filter((p) => p.is_active).map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-gray-600">Aantal</span>
            <input
              type="number"
              min={1}
              value={purchaseQty}
              onChange={(e) => setPurchaseQty(Number(e.target.value))}
              className="w-full rounded border px-2 py-1.5 text-sm"
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-gray-600">Notitie</span>
            <input
              value={purchaseNote}
              onChange={(e) => setPurchaseNote(e.target.value)}
              className="w-full rounded border px-2 py-1.5 text-sm"
              placeholder="optioneel"
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-60"
            >
              {isPending ? "Verwerken..." : "Verwerk purchase"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded border bg-white p-4 space-y-4">
        <h2 className="text-base font-semibold">
          Jaarabonnement toekennen (alleen opdrachten)
        </h2>
        <form onSubmit={submitEntitlement} className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-gray-600">Gebruiker</span>
            <select
              value={entitlementUserId}
              onChange={(e) => setEntitlementUserId(e.target.value)}
              className="w-full rounded border px-2 py-1.5 text-sm"
              required
            >
              <option value="">Selecteer gebruiker</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {(user.display_name || user.email || user.user_id) + ` (${user.user_id.slice(0, 8)})`}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-gray-600">Duur (maanden)</span>
            <input
              type="number"
              min={1}
              value={entitlementMonths}
              onChange={(e) => setEntitlementMonths(Number(e.target.value))}
              className="w-full rounded border px-2 py-1.5 text-sm"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-gray-600">Notitie</span>
            <input
              value={entitlementNote}
              onChange={(e) => setEntitlementNote(e.target.value)}
              className="w-full rounded border px-2 py-1.5 text-sm"
              placeholder="optioneel"
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-60"
            >
              {isPending ? "Verwerken..." : "Jaarabonnement toekennen"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded border bg-white p-4">
        <h2 className="text-base font-semibold">Alle aankoop transacties</h2>
        <div className="mt-3 overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left">Datum</th>
                <th className="px-2 py-2 text-left">User</th>
                <th className="px-2 py-2 text-left">Type</th>
                <th className="px-2 py-2 text-left">Item</th>
                <th className="px-2 py-2 text-left">Scope</th>
                <th className="px-2 py-2 text-right">Qty</th>
                <th className="px-2 py-2 text-right">Credits</th>
                <th className="px-2 py-2 text-right">Bedrag</th>
              </tr>
            </thead>
            <tbody>
              {allPurchaseEvents.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-2 py-2">
                    {new Date(row.created_at).toLocaleString("nl-NL")}
                  </td>
                  <td className="px-2 py-2">{userLabelById.get(row.user_id) ?? `${row.user_id.slice(0, 8)}...`}</td>
                  <td className="px-2 py-2">{row.kind === "pack" ? "Pack purchase" : "Content unlock"}</td>
                  <td className="px-2 py-2">
                    {row.label}
                  </td>
                  <td className="px-2 py-2">{row.scope}</td>
                  <td className="px-2 py-2 text-right">{row.qty}</td>
                  <td className="px-2 py-2 text-right">{row.credits}</td>
                  <td className="px-2 py-2 text-right">
                    {row.amount}
                  </td>
                </tr>
              ))}
              {allPurchaseEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-4 text-center text-gray-500">
                    Nog geen aankoop transacties.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
