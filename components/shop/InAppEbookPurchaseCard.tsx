"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Props = {
  readerHref: string | null;
  hasAccess: boolean;
  purchaseHref: string | null;
  purchaseDescription: string;
  purchaseButtonLabel: string;
  isInDevelopment: boolean;
  developmentPurchaseText: string;
  developmentCalloutLabel: string;
  language: UiLanguage;
};

const COPY = {
  nl: {
    missing: "Dit e-book is aangekocht, maar nog niet gekoppeld aan de app-reader.",
    open: "Open e-book in app",
    bodyBeforePurchase:
      "Koop dit e-book via De Troostboom. Na succesvolle bestelling verschijnt het in je account onder EBooks en lees je het veilig in de app-reader.",
    bodyWhenReady:
      "Dit e-book is al aan jouw account gekoppeld. Je kunt het nu direct veilig lezen in de app-reader.",
  },
  en: {
    missing: "This ebook has been purchased, but it is not linked to the app reader yet.",
    open: "Open ebook in app",
    bodyBeforePurchase:
      "Buy this ebook via De Troostboom. After a successful order it appears in your account under EBooks and can be read inside the protected app reader.",
    bodyWhenReady:
      "This ebook is already linked to your account. You can now read it directly in the protected app reader.",
  },
  de: {
    missing: "Dieses E-Book wurde gekauft, ist aber noch nicht mit dem App-Reader verknupft.",
    open: "E-Book in der App offnen",
    bodyBeforePurchase:
      "Kaufe dieses E-Book uber De Troostboom. Nach erfolgreicher Bestellung erscheint es in deinem Konto unter EBooks und kann sicher im App-Reader gelesen werden.",
    bodyWhenReady:
      "Dieses E-Book ist bereits mit deinem Konto verknupft. Du kannst es jetzt direkt im geschutzten App-Reader lesen.",
  },
} as const;

export default function InAppEbookPurchaseCard({
  readerHref,
  hasAccess,
  purchaseHref,
  purchaseDescription,
  purchaseButtonLabel,
  isInDevelopment,
  developmentPurchaseText,
  developmentCalloutLabel,
  language,
}: Props) {
  const t = COPY[language] ?? COPY.nl;

  if (hasAccess && readerHref) {
    return (
      <article className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 shadow-sm">
        <p className="text-sm leading-6 text-[#6b5d50]">{t.bodyWhenReady}</p>
        <div className="mt-4">
          <Link
            href={readerHref}
            className="inline-flex items-center gap-2 rounded-full border border-[#9e3a3a] bg-[#b64040] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9e3a3a]"
          >
            {t.open}
            <ExternalLink size={16} strokeWidth={1.8} />
          </Link>
        </div>
      </article>
    );
  }

  if (hasAccess && !readerHref) {
    return (
      <article className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 shadow-sm">
        <p className="text-sm leading-6 text-[#6b5d50]">{t.missing}</p>
      </article>
    );
  }

  return (
    <article className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 shadow-sm">
      <p className="text-sm leading-6 text-[#6b5d50]">{t.bodyBeforePurchase}</p>

      <div className="mt-4">
        {!isInDevelopment && purchaseHref ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#6b5d50]">{purchaseDescription}</p>
            <a
              href={purchaseHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#9e3a3a] bg-[#b64040] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9e3a3a]"
            >
              {purchaseButtonLabel}
              <ExternalLink size={16} strokeWidth={1.8} />
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#6b5d50]">
              {isInDevelopment ? developmentPurchaseText : t.missing}
            </p>
            <div className="inline-flex rounded-full border border-[#decfbe] bg-[#fcf6f1] px-4 py-2 text-sm font-medium text-[#8a5f49]">
              {developmentCalloutLabel}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
