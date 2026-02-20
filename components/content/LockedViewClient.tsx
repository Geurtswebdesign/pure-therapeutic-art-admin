"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { unlockContentItem } from "@/app/content/actions";
import { Lock, ShoppingCart, Unlock } from "lucide-react";

type Props = {
  contentId: string;
  cost: number;
  balance: number;
  isLoggedIn: boolean;
};

export default function LockedViewClient({
  contentId,
  cost,
  balance,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const insufficient = balance < cost;
  const loginHref = `/login?next=${encodeURIComponent(pathname || "/")}`;
  const buyCreditsHref = "/credits";

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
    <section className="space-y-5">
      <div className="flex justify-center">
        <Lock className="lockout-lock-icon h-10 w-10" />
      </div>

      <div className="space-y-2 text-center">
        <p className="lockout-copy">
          Wil je de rest van de opdracht ontgrendelen?
        </p>
        <p className="lockout-copy">
          Kies wat bij jou past. Credit verlopen niet en zijn geldig voor alle opdrachten.
        </p>
      </div>

      {isLoggedIn ? (
        <>
          <p className="lockout-muted text-center text-sm">
            Kosten: <strong>{cost} credits</strong> • Saldo: <strong>{balance} credits</strong>
          </p>

          {insufficient ? (
            <Link
              href={buyCreditsHref}
              className="lockout-cta flex w-full items-center justify-between rounded-sm border px-4 py-3 text-left shadow-sm transition"
            >
              <span className="lockout-cta-text">
                Credits kopen
              </span>
              <ShoppingCart className="h-7 w-7" />
            </Link>
          ) : (
            <button
              onClick={handleUnlock}
              disabled={isPending}
              className="lockout-cta flex w-full items-center justify-between rounded-sm border px-4 py-3 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="lockout-cta-text">
                Direct ontgrendelen
              </span>
              <Unlock className="h-7 w-7" />
            </button>
          )}
        </>
      ) : (
        <Link
          href={loginHref}
          className="lockout-cta flex w-full items-center justify-between rounded-sm border px-4 py-3 text-left shadow-sm transition"
        >
          <span className="lockout-cta-text">
            Inloggen om te ontgrendelen
          </span>
          <ShoppingCart className="h-7 w-7" />
        </Link>
      )}

      {isPending ? (
        <p className="lockout-muted text-center text-sm">
          Bezig met ontgrendelen...
        </p>
      ) : null}
      {isLoggedIn && insufficient ? (
        <p className="lockout-error text-center text-sm">
          Onvoldoende credits. Je saldo is {balance} credits en je hebt {cost} nodig.
        </p>
      ) : null}
      {error ? (
        <p className="lockout-error text-center text-sm">
          {error}
        </p>
      ) : null}
    </section>
  );
}
