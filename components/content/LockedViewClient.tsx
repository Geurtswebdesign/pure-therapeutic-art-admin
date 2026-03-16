"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { unlockContentItem } from "@/app/content/actions";
import { Lock, ShoppingCart, Unlock } from "lucide-react";
import type { ContentAccessScope } from "@/lib/content/access";
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";
import { trackEvent } from "@/lib/analytics/track";

type Props = {
  contentId: string;
  cost: number;
  balance: number;
  scope: ContentAccessScope;
  isLoggedIn: boolean;
  language: UiLanguage;
};

export default function LockedViewClient({
  contentId,
  cost,
  balance,
  scope,
  isLoggedIn,
  language,
}: Props) {
  const t = getAppMessages(language).lockedView;
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const insufficient = balance < cost;
  const loginHref = `/login?next=${encodeURIComponent(pathname || "/")}`;
  const buyCreditsHref = "/credits";
  const scopeLabel =
    scope === "book"
      ? t.scopeBook
      : scope === "game"
        ? t.scopeGame
        : scope === "referral"
          ? t.scopeReferral
          : t.scopeAssignment;

  async function handleUnlock() {
    setError(null);
    trackEvent({
      eventName: "content_unlock_attempt",
      eventCategory: "content",
      eventLabel: contentId,
      eventValue: cost,
    });

    startTransition(async () => {
      try {
        const result = await unlockContentItem(contentId);

        if (!result.unlocked) {
          if (result.error === "INSUFFICIENT_CREDITS") {
            trackEvent({
              eventName: "content_unlock_failed",
              eventCategory: "content",
              eventLabel: "INSUFFICIENT_CREDITS",
              eventValue: cost,
            });
            setError(
              t.insufficient
                .replaceAll("{scope}", scopeLabel)
                .replace("{balance}", String(result.balance))
                .replace("{cost}", String(result.cost))
            );
            return;
          }
          if (result.error === "INSUFFICIENT_SCOPE_CREDITS") {
            trackEvent({
              eventName: "content_unlock_failed",
              eventCategory: "content",
              eventLabel: "INSUFFICIENT_SCOPE_CREDITS",
              eventValue: cost,
            });
            setError(
              t.insufficient
                .replaceAll("{scope}", scopeLabel)
                .replace("{balance}", String(result.balance))
                .replace("{cost}", String(result.cost))
            );
            return;
          }
        }

        trackEvent({
          eventName: "content_unlock_success",
          eventCategory: "content",
          eventLabel: contentId,
          eventValue: cost,
        });
        router.refresh();
      } catch {
        trackEvent({
          eventName: "content_unlock_failed",
          eventCategory: "content",
          eventLabel: "error",
          eventValue: cost,
        });
        setError(t.unlockFailed);
      }
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex justify-center">
        <Lock className="lockout-lock-icon" />
      </div>

      <div className="space-y-2 text-center">
        <p className="lockout-copy">
          {t.askAccess.replace("{scope}", scopeLabel)}
        </p>
        <p className="lockout-copy">
          {t.useCredits.replace("{scope}", scopeLabel)}
        </p>
      </div>

      {isLoggedIn ? (
        <>
          <p className="lockout-muted text-center text-sm">
            {t.costBalance
              .replaceAll("{scope}", scopeLabel)
              .replace("{cost}", String(cost))
              .replace("{balance}", String(balance))}
          </p>

          {insufficient ? (
            <Link
              href={buyCreditsHref}
              onClick={() =>
                trackEvent({
                  eventName: "buy_credits_click",
                  eventCategory: "credits",
                  eventLabel: scopeLabel,
                })
              }
              className="lockout-cta flex w-full items-center justify-between rounded-sm border px-4 py-3 text-left shadow-sm transition"
            >
              <span className="lockout-cta-text">
                {t.buyCredits}
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
                {t.unlockNow}
              </span>
              <Unlock className="h-7 w-7" />
            </button>
          )}
        </>
      ) : (
        <Link
          href={loginHref}
          onClick={() =>
            trackEvent({
              eventName: "login_to_unlock_click",
              eventCategory: "auth",
              eventLabel: scopeLabel,
            })
          }
          className="lockout-cta flex w-full items-center justify-between rounded-sm border px-4 py-3 text-left shadow-sm transition"
        >
          <span className="lockout-cta-text">
            {t.loginToUnlock}
          </span>
          <ShoppingCart className="h-7 w-7" />
        </Link>
      )}

      {isPending ? (
        <p className="lockout-muted text-center text-sm">
          {t.unlocking}
        </p>
      ) : null}
      {isLoggedIn && insufficient ? (
        <p className="lockout-error text-center text-sm">
          {t.insufficient
            .replaceAll("{scope}", scopeLabel)
            .replace("{balance}", String(balance))
            .replace("{cost}", String(cost))}
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
