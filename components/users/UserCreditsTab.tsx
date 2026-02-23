"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { grantCredits } from "@/lib/credits/grantCredits";
import type { CreditWallet, CreditTransaction } from "@/lib/credits/types";
import { deactivateYearAssignmentsEntitlement } from "@/app/admin/users/actions";

import CreditOverview from "@/components/users/CreditOverview";
import CreditTransactions from "@/components/users/CreditTransactions";

type Props = {
  userId: string;
  wallet: CreditWallet;
  transactions: CreditTransaction[];
  yearEntitlements: {
    id: string;
    entitlement_key: string;
    starts_at: string;
    ends_at: string | null;
    is_active: boolean;
    created_at: string;
  }[];
  isSelf: boolean;
  isSuperAdmin: boolean; // ⭐ TOEGEVOEGD
};

export default function UserCreditsTab({
  userId,
  wallet,
  transactions,
  yearEntitlements,
  isSelf,
  isSuperAdmin,
}: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [entitlementBusyId, setEntitlementBusyId] = useState<string | null>(null);

  // ✅ JUISTE UI-GUARD
  const disableActions = isSelf && !isSuperAdmin;

  async function apply(delta: number) {
    if (delta === 0) return;

    setLoading(true);
    try {
      await grantCredits({
        userId,
        amount: delta,
        reason: "admin_adjust",
      });

      setAmount(0);
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "Credits aanpassen mislukt";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(entitlementId: string) {
    setEntitlementBusyId(entitlementId);
    try {
      await deactivateYearAssignmentsEntitlement({
        entitlementId,
        userId,
      });
      router.refresh();
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "Abonnement beëindigen mislukt";
      alert(message);
    } finally {
      setEntitlementBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <CreditOverview wallet={wallet} />

      <section className="rounded border bg-white p-4 space-y-3">
        <h2 className="text-sm font-semibold">
          Credits aanpassen
        </h2>

        {isSelf && !isSuperAdmin && (
          <p className="text-xs text-red-600">
            Je kunt je eigen credits niet aanpassen.
          </p>
        )}

        <div className="flex items-center gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-24 rounded border px-2 py-1 text-sm"
          />

          <button
            onClick={() => apply(amount)}
            disabled={loading || disableActions || amount <= 0}
            className="rounded bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            Toevoegen
          </button>

          <button
            onClick={() => apply(-amount)}
            disabled={loading || disableActions || amount <= 0}
            className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            Aftrekken
          </button>
        </div>
      </section>

      <section className="rounded border bg-white p-4 space-y-3">
        <h2 className="text-sm font-semibold">
          Jaarabonnement opdrachten
        </h2>

        {yearEntitlements.length === 0 ? (
          <p className="text-sm text-gray-600">
            Geen jaarabonnementen gevonden.
          </p>
        ) : (
          <div className="space-y-2">
            {yearEntitlements.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded border px-3 py-2 text-sm"
              >
                <div>
                  <div>
                    Start: {new Date(item.starts_at).toLocaleDateString("nl-NL")} • Einde: {item.ends_at ? new Date(item.ends_at).toLocaleDateString("nl-NL") : "onbepaald"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Status: {item.is_active ? "actief" : "beëindigd"}
                  </div>
                </div>

                {item.is_active ? (
                  <button
                    type="button"
                    onClick={() => handleDeactivate(item.id)}
                    disabled={entitlementBusyId === item.id}
                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 disabled:opacity-50"
                  >
                    {entitlementBusyId === item.id ? "Beëindigen..." : "Beëindigen"}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <CreditTransactions transactions={transactions} />
    </div>
  );
}
