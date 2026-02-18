"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unlockContentItem } from "@/app/content/actions";

type Props = {
  contentId: string;
  cost: number;
  balance: number;
};

export default function LockedViewClient({
  contentId,
  cost,
  balance,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const insufficient = balance < cost;

  async function handleUnlock() {
    setError(null);

    startTransition(async () => {
      try {
        const result = await unlockContentItem(contentId);

        if (!result.unlocked) {
          if (result.error === "INSUFFICIENT_CREDITS") {
            setError(
              `Onvoldoende credits. Je hebt ${result.balance}, nodig: ${result.cost}.`
            );
            return;
          }
        }

        router.refresh();
      } catch {
        setError("Er ging iets mis bij het ontgrendelen.");
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
      <h1 className="text-3xl font-semibold">🔒 Vergrendelde Content</h1>

      <div className="space-y-2">
        <p>
          Deze content kost <strong>{cost} credits</strong>.
        </p>

        <p className="text-sm text-gray-600">
          Je huidige saldo:{" "}
          <span className="font-semibold">{balance} credits</span>
        </p>
      </div>

      <button
        onClick={handleUnlock}
        disabled={isPending || insufficient}
        className="px-6 py-3 bg-black text-white rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        {insufficient
          ? "Onvoldoende credits"
          : isPending
          ? "Bezig..."
          : `Ontgrendel voor ${cost} credits`}
      </button>

      {insufficient && (
        <p className="text-sm text-red-600">
          Je hebt onvoldoende credits om deze content te ontgrendelen.
        </p>
      )}

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
}
