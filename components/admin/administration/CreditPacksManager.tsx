"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Pencil, Power, PowerOff } from "lucide-react";
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

function scopeLabel(scope: CreditPack["credit_scope"]) {
  if (scope === "assignment") return "opdrachten";
  if (scope === "book") return "boeken";
  if (scope === "game") return "spellen";
  return "verwijsbestanden";
}

export default function CreditPacksManager({
  packs,
  users,
}: {
  packs: CreditPack[];
  users: UserOption[];
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
  const [openSection, setOpenSection] = useState<"pack" | "purchase" | "entitlement">("pack");

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
    setOpenSection("pack");
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
          setMessage("Creditpack bijgewerkt.");
        } else {
          await createCreditPack(packForm);
          setMessage("Creditpack aangemaakt.");
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
        setError(
          err instanceof Error ? err.message : "Status wijzigen mislukt."
        );
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
        setMessage("Pack-aankoop verwerkt.");
        setPurchaseQty(1);
        setPurchaseNote("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Aankoop mislukt.");
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
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded border bg-white p-4">
            <h2 className="text-base font-semibold">Pakketten</h2>
            <div className="mt-3 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left">Naam</th>
                    <th className="px-2 py-2 text-left">Slug</th>
                    <th className="px-2 py-2 text-left">Type</th>
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
                        <td className="px-2 py-2">{scopeLabel(pack.credit_scope)}</td>
                        <td className="px-2 py-2 text-right">{total}</td>
                        <td className="px-2 py-2 text-right">
                          {(pack.price_cents / 100).toFixed(2)} {pack.currency}
                        </td>
                        <td className="px-2 py-2">
                          {pack.is_active ? "Actief" : "Inactief"}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => fillEdit(pack)}
                              className="rounded border p-1.5 text-gray-700 hover:bg-gray-50"
                              title="Bewerken"
                              aria-label="Bewerken"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => togglePack(pack.id, !pack.is_active)}
                              className="rounded border p-1.5 text-gray-700 hover:bg-gray-50"
                              title={pack.is_active ? "Uitschakelen" : "Inschakelen"}
                              aria-label={pack.is_active ? "Uitschakelen" : "Inschakelen"}
                            >
                              {pack.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                            </button>
                          </div>
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
            <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600">
              <span className="font-medium">Legenda acties:</span>{" "}
              <span className="inline-flex items-center gap-1">
                <Pencil size={12} /> Bewerken
              </span>{" "}
              •{" "}
              <span className="inline-flex items-center gap-1">
                <PowerOff size={12} /> Uitschakelen
              </span>{" "}
              •{" "}
              <span className="inline-flex items-center gap-1">
                <Power size={12} /> Inschakelen
              </span>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded border bg-white">
            <button
              type="button"
              onClick={() => setOpenSection("pack")}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <h2 className="text-base font-semibold">
                {editingPackId ? "Creditpack bewerken" : "Nieuw creditpack"}
              </h2>
              <ChevronDown
                size={16}
                className={openSection === "pack" ? "rotate-180 transition-transform" : "transition-transform"}
              />
            </button>
            {openSection === "pack" ? (
              <div className="border-t p-4">
                <form onSubmit={submitPackForm} className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-sm text-gray-600">Slug</span>
                    <input
                      value={packForm.slug}
                      onChange={(e) => setPackForm((s) => ({ ...s, slug: e.target.value }))}
                      className="w-full rounded border px-2 py-1.5 text-sm"
                      required
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm text-gray-600">Naam</span>
                    <input
                      value={packForm.name}
                      onChange={(e) => setPackForm((s) => ({ ...s, name: e.target.value }))}
                      className="w-full rounded border px-2 py-1.5 text-sm"
                      required
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm text-gray-600">Type credits</span>
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
                    <span className="text-sm text-gray-600">Basiscredits</span>
                    <input
                      type="number"
                      min={1}
                      value={packForm.credits_base}
                      onChange={(e) =>
                        setPackForm((s) => ({ ...s, credits_base: Number(e.target.value) }))
                      }
                      className="w-full rounded border px-2 py-1.5 text-sm"
                      required
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm text-gray-600">Bonuscredits</span>
                    <input
                      type="number"
                      min={0}
                      value={packForm.bonus_credits}
                      onChange={(e) =>
                        setPackForm((s) => ({ ...s, bonus_credits: Number(e.target.value) }))
                      }
                      className="w-full rounded border px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm text-gray-600">Prijs (cents)</span>
                    <input
                      type="number"
                      min={0}
                      value={packForm.price_cents}
                      onChange={(e) =>
                        setPackForm((s) => ({ ...s, price_cents: Number(e.target.value) }))
                      }
                      className="w-full rounded border px-2 py-1.5 text-sm"
                      required
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm text-gray-600">Valuta</span>
                    <input
                      value={packForm.currency}
                      onChange={(e) =>
                        setPackForm((s) => ({ ...s, currency: e.target.value.toUpperCase() }))
                      }
                      className="w-full rounded border px-2 py-1.5 text-sm"
                      required
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm text-gray-600">Sorteervolgorde</span>
                    <input
                      type="number"
                      value={packForm.sort_order}
                      onChange={(e) =>
                        setPackForm((s) => ({ ...s, sort_order: Number(e.target.value) }))
                      }
                      className="w-full rounded border px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="flex items-center gap-2 pt-6 text-sm">
                    <input
                      type="checkbox"
                      checked={packForm.is_active}
                      onChange={(e) =>
                        setPackForm((s) => ({ ...s, is_active: e.target.checked }))
                      }
                    />
                    Actief
                  </label>

                  <div className="md:col-span-2 flex items-center gap-2">
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
              </div>
            ) : null}
          </section>

          <section className="rounded border bg-white">
            <button
              type="button"
              onClick={() => setOpenSection("purchase")}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <h2 className="text-base font-semibold">Pack toekennen aan gebruiker</h2>
              <ChevronDown
                size={16}
                className={openSection === "purchase" ? "rotate-180 transition-transform" : "transition-transform"}
              />
            </button>
            {openSection === "purchase" ? (
              <div className="border-t p-4">
                <form onSubmit={submitPurchase} className="grid gap-3">
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

                  <div>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-60"
                    >
                      {isPending ? "Verwerken..." : "Verwerk aankoop"}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </section>

          <section className="rounded border bg-white">
            <button
              type="button"
              onClick={() => setOpenSection("entitlement")}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <h2 className="text-base font-semibold">Jaarabonnement toekennen (alleen opdrachten)</h2>
              <ChevronDown
                size={16}
                className={openSection === "entitlement" ? "rotate-180 transition-transform" : "transition-transform"}
              />
            </button>
            {openSection === "entitlement" ? (
              <div className="border-t p-4">
                <form onSubmit={submitEntitlement} className="grid gap-3">
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

                  <label className="space-y-1">
                    <span className="text-sm text-gray-600">Notitie</span>
                    <input
                      value={entitlementNote}
                      onChange={(e) => setEntitlementNote(e.target.value)}
                      className="w-full rounded border px-2 py-1.5 text-sm"
                      placeholder="optioneel"
                    />
                  </label>

                  <div>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-60"
                    >
                      {isPending ? "Verwerken..." : "Jaarabonnement toekennen"}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </section>

          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
