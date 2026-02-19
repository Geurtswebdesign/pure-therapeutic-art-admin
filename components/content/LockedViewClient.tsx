"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unlockContentItem } from "@/app/content/actions";
import { Lock, ShoppingCart } from "lucide-react";

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
    <section className="rounded-md border border-[#d8cec4] bg-[#efe7df] p-5 shadow-sm">
      <div className="space-y-5 text-[#1f1f1f]">
        <div className="flex justify-center">
          <div className="rounded-full border border-[#d0c4b9] bg-[#f6efe8] p-3">
            <Lock className="h-7 w-7 text-[#2b2b2b]" />
          </div>
        </div>

        <div className="space-y-3 text-center">
          <p className="text-lg font-medium">
            Wil je de rest van de opdracht ontgrendelen?
          </p>
          <p className="text-sm leading-relaxed text-[#3a3a3a]">
            Kies wat bij jou past. Credit verlopen niet en zijn geldig voor alle opdrachten.
          </p>
          <p className="text-sm text-[#5a5a5a]">
            Kosten: <span className="font-semibold">{cost} credits</span> • Saldo:{" "}
            <span className="font-semibold">{balance} credits</span>
          </p>
        </div>

        <button
          onClick={handleUnlock}
          disabled={isPending || insufficient}
          className="flex w-full items-center justify-between rounded-sm border border-[#b8b8b8] bg-[#d8d8d8] px-4 py-3 text-left text-[#1f1f1f] shadow-sm transition hover:bg-[#cecece] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="text-3xl font-semibold tracking-tight">Credits Kopen</span>
          <ShoppingCart className="h-8 w-8" />
        </button>

        {isPending ? (
          <p className="text-center text-sm">Bezig met ontgrendelen...</p>
        ) : null}
        {insufficient ? (
          <p className="text-center text-sm text-[#8d1f1f]">
            Onvoldoende credits om nu te ontgrendelen.
          </p>
        ) : null}
        {error ? (
          <p className="text-center text-sm text-[#8d1f1f]">{error}</p>
        ) : null}
      </div>
    </section>
  );
}
