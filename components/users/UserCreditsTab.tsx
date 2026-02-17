"use client";

import { useState } from "react";
import { grantCredits } from "@/lib/credits/grandCredits";

import type {
  CreditWallet,
  CreditTransaction,
} from "@/lib/credits/types";

import CreditOverview from "@/components/users/CreditOverview";
import CreditTransactions from "@/components/users/CreditTransactions";

type Props = {
  userId: string;
  wallet: CreditWallet;
  transactions: CreditTransaction[];
  isSelf: boolean;
  isSuperAdmin: boolean; // ⭐ TOEGEVOEGD
};

export default function UserCreditsTab({
  userId,
  wallet,
  transactions,
  isSelf,
  isSuperAdmin,
}: Props) {
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

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

      <CreditTransactions transactions={transactions} />
    </div>
  );
}
