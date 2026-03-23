"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { ExternalLink, ShoppingCart, Unlock } from "lucide-react";
import { unlockEbookProduct } from "@/app/shop/ebook-actions";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Props = {
  productSlug: string;
  readerHref: string | null;
  isReady: boolean;
  cost: number;
  balance: number;
  isLoggedIn: boolean;
  hasAccess: boolean;
  language: UiLanguage;
};

const COPY = {
  nl: {
    missing: "Dit e-book is nog niet helemaal klaar voor de app-reader.",
    open: "Open e-book in app",
    unlock: "Speel e-book vrij in app",
    unlocking: "Bezig met vrijspelen...",
    buyCredits: "Koop boekcredits",
    login: "Log in om dit e-book vrij te spelen",
    insufficient:
      "Je hebt niet genoeg boekcredits om dit e-book vrij te spelen.",
    bodyWhenReady:
      "Dit e-book wordt in de app vrijgespeeld. Na aankoop of vrijspelen lees je het direct veilig in de app-reader.",
    bodyWhenPreparing:
      "Dit e-book wordt als app-product ingericht. Zodra de readerkoppeling volledig klaar staat, kun je het hier direct openen.",
  },
  en: {
    missing: "This ebook is not fully ready for the in-app reader yet.",
    open: "Open ebook in app",
    unlock: "Unlock ebook in app",
    unlocking: "Unlocking...",
    buyCredits: "Buy book credits",
    login: "Log in to unlock this ebook",
    insufficient: "You do not have enough book credits to unlock this ebook.",
    bodyWhenReady:
      "This ebook is unlocked inside the app. After purchase or unlock, you can read it directly in the protected app reader.",
    bodyWhenPreparing:
      "This ebook is being prepared as an in-app product. Once the reader link is fully ready, you can open it here directly.",
  },
  de: {
    missing: "Dieses E-Book ist noch nicht vollstandig fur den App-Reader bereit.",
    open: "E-Book in der App offnen",
    unlock: "E-Book in der App freischalten",
    unlocking: "Wird freigeschaltet...",
    buyCredits: "Buchcredits kaufen",
    login: "Melde dich an, um dieses E-Book freizuschalten",
    insufficient:
      "Du hast nicht genug Buchcredits, um dieses E-Book freizuschalten.",
    bodyWhenReady:
      "Dieses E-Book wird direkt in der App freigeschaltet. Danach liest du es sicher im geschutzten App-Reader.",
    bodyWhenPreparing:
      "Dieses E-Book wird als App-Produkt vorbereitet. Sobald die Reader-Verknupfung fertig ist, kannst du es hier direkt offnen.",
  },
} as const;

export default function InAppEbookPurchaseCard({
  productSlug,
  readerHref,
  isReady,
  cost,
  balance,
  isLoggedIn,
  hasAccess,
  language,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = COPY[language] ?? COPY.nl;

  if (!isReady || !readerHref) {
    return (
      <article className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 shadow-sm">
        <p className="text-sm leading-6 text-[#6b5d50]">{t.bodyWhenPreparing}</p>
        <div className="mt-4 inline-flex rounded-full border border-[#decfbe] bg-[#fcf6f1] px-4 py-2 text-sm font-medium text-[#8a5f49]">
          {t.missing}
        </div>
      </article>
    );
  }

  const resolvedReaderHref = readerHref;
  const loginHref = `/login?next=${encodeURIComponent(pathname || readerHref)}`;
  const creditsHref = "/shop/credits?scope=book";
  const requiresUnlock = cost > 0;
  const insufficient = requiresUnlock && balance < cost;

  function handleUnlock() {
    startTransition(async () => {
      await unlockEbookProduct(productSlug);
      router.push(resolvedReaderHref);
      router.refresh();
    });
  }

  return (
    <article className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 shadow-sm">
      <p className="text-sm leading-6 text-[#6b5d50]">{t.bodyWhenReady}</p>

      <div className="mt-4">
        {hasAccess || !requiresUnlock ? (
          <Link
            href={isLoggedIn ? readerHref : loginHref}
            className="inline-flex items-center gap-2 rounded-full border border-[#9e3a3a] bg-[#b64040] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9e3a3a]"
          >
            {isLoggedIn ? t.open : t.login}
            <ExternalLink size={16} strokeWidth={1.8} />
          </Link>
        ) : !isLoggedIn ? (
          <Link
            href={loginHref}
            className="inline-flex items-center gap-2 rounded-full border border-[#9e3a3a] bg-[#b64040] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9e3a3a]"
          >
            {t.login}
            <ExternalLink size={16} strokeWidth={1.8} />
          </Link>
        ) : insufficient ? (
          <div className="space-y-3">
            <p className="text-sm text-[#8a5f49]">{t.insufficient}</p>
            <Link
              href={creditsHref}
              className="inline-flex items-center gap-2 rounded-full border border-[#9e3a3a] bg-[#b64040] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9e3a3a]"
            >
              {t.buyCredits}
              <ShoppingCart size={16} strokeWidth={1.8} />
            </Link>
          </div>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={handleUnlock}
            className="inline-flex items-center gap-2 rounded-full border border-[#9e3a3a] bg-[#b64040] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9e3a3a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? t.unlocking : t.unlock}
            <Unlock size={16} strokeWidth={1.8} />
          </button>
        )}
      </div>
    </article>
  );
}
