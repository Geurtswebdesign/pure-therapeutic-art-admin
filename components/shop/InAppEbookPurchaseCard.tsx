"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { resolveBaseUiLanguage, type UiLanguage } from "@/lib/i18n/runtime";
import { purchaseEbookInApp } from "@/app/shop/ebook-actions";
import type { EbookPurchaseMode } from "@/lib/shop/ebook-purchase-mode";
import NativeEbookPurchaseButton from "@/components/shop/NativeEbookPurchaseButton";

type Props = {
  productSlug: string;
  readerHref: string | null;
  hasAccess: boolean;
  isLoggedIn: boolean;
  isReady: boolean;
  hasStoreConfiguration: boolean;
  appleStoreProductId: string;
  googleStoreProductId: string;
  purchaseDescription: string;
  purchaseButtonLabel: string;
  developmentPurchaseText: string;
  developmentCalloutLabel: string;
  purchaseMode: EbookPurchaseMode;
  language: UiLanguage;
};

const COPY = {
  nl: {
    missing: "Dit e-book is aangekocht, maar nog niet gekoppeld aan de app-reader.",
    open: "Open e-book in app",
    login: "Log in om dit e-book in de app te kopen.",
    signIn: "Log in",
    bodyBeforePurchase:
      "Koop dit e-book in de app. Na succesvolle aankoop verschijnt het in je account onder EBooks en lees je het veilig in de app-reader.",
    bodyWhenReady:
      "Dit e-book is al aan jouw account gekoppeld. Je kunt het nu direct veilig lezen in de app-reader.",
    purchaseDisabled:
      "De interne betaalstap voor e-books is nog niet gekoppeld. De product- en readerflow staan nu wel klaar.",
    buying: "Aankoop verwerken...",
    readinessMissing:
      "Dit e-book is nog niet volledig klaar om in de app te lezen. Koppel eerst een definitief EPUB-bestand.",
    nativeOnly:
      "Dit e-book koop je via Apple of Google in de native app. Na succesvolle store-aankoop verschijnt het automatisch in je account onder EBooks.",
    nativeMissing:
      "Voor dit e-book ontbreken nog de Apple- en/of Google-product-id's. Vul die eerst in de shopadmin in.",
    nativeBadge: "Beschikbaar in native app",
  },
  en: {
    missing: "This ebook has been purchased, but it is not linked to the app reader yet.",
    open: "Open ebook in app",
    login: "Log in to buy this ebook in the app.",
    signIn: "Log in",
    bodyBeforePurchase:
      "Buy this ebook in the app. After a successful purchase it appears in your account under EBooks and can be read inside the protected app reader.",
    bodyWhenReady:
      "This ebook is already linked to your account. You can now read it directly in the protected app reader.",
    purchaseDisabled:
      "The in-app payment step for ebooks is not connected yet. The product and reader flow are already in place.",
    buying: "Processing purchase...",
    readinessMissing:
      "This ebook is not fully ready to be read in the app yet. First attach a final EPUB file.",
    nativeOnly:
      "Buy this ebook through Apple or Google in the native app. After a successful store purchase it will appear automatically in your account under EBooks.",
    nativeMissing:
      "This ebook is missing the Apple and/or Google store product IDs. Fill those in first in the shop admin.",
    nativeBadge: "Available in native app",
  },
  de: {
    missing: "Dieses E-Book wurde gekauft, ist aber noch nicht mit dem App-Reader verknupft.",
    open: "E-Book in der App offnen",
    login: "Melde dich an, um dieses E-Book in der App zu kaufen.",
    signIn: "Anmelden",
    bodyBeforePurchase:
      "Kaufe dieses E-Book in der App. Nach erfolgreichem Kauf erscheint es in deinem Konto unter EBooks und kann sicher im App-Reader gelesen werden.",
    bodyWhenReady:
      "Dieses E-Book ist bereits mit deinem Konto verknupft. Du kannst es jetzt direkt im geschutzten App-Reader lesen.",
    purchaseDisabled:
      "Die interne Bezahlstufe fur E-Books ist noch nicht gekoppelt. Produkt- und Readerfluss stehen aber bereits.",
    buying: "Kauf wird verarbeitet...",
    readinessMissing:
      "Dieses E-Book ist noch nicht vollstandig bereit fur den App-Reader. Verknupfe zuerst eine finale EPUB-Datei.",
    nativeOnly:
      "Dieses E-Book kaufst du uber Apple oder Google in der nativen App. Nach erfolgreichem Store-Kauf erscheint es automatisch in deinem Konto unter EBooks.",
    nativeMissing:
      "Fur dieses E-Book fehlen noch die Apple- und/oder Google-Produkt-IDs. Trage sie zuerst in der Shop-Admin ein.",
    nativeBadge: "In nativer App verfugbar",
  },
} as const;

export default function InAppEbookPurchaseCard({
  productSlug,
  readerHref,
  hasAccess,
  isLoggedIn,
  isReady,
  hasStoreConfiguration,
  appleStoreProductId,
  googleStoreProductId,
  purchaseDescription,
  purchaseButtonLabel,
  developmentPurchaseText,
  developmentCalloutLabel,
  purchaseMode,
  language,
}: Props) {
  const t = COPY[resolveBaseUiLanguage(language)];
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

  if (!isReady) {
    return (
      <article className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 shadow-sm">
        <p className="text-sm leading-6 text-[#6b5d50]">{t.readinessMissing}</p>
        <div className="mt-4 inline-flex rounded-full border border-[#decfbe] bg-[#fcf6f1] px-4 py-2 text-sm font-medium text-[#8a5f49]">
          {developmentCalloutLabel}
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
        {!isLoggedIn ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#6b5d50]">{t.login}</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-[#9e3a3a] bg-[#b64040] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9e3a3a]"
            >
              {t.signIn}
              <ExternalLink size={16} strokeWidth={1.8} />
            </Link>
          </div>
        ) : purchaseMode === "direct_grant" ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#6b5d50]">{purchaseDescription}</p>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  try {
                    await purchaseEbookInApp(productSlug);
                  } catch (nextError) {
                    setError(
                      nextError instanceof Error
                        ? nextError.message
                        : "Aankoop verwerken mislukt."
                    );
                  }
                })
              }
              className="inline-flex items-center gap-2 rounded-full border border-[#9e3a3a] bg-[#b64040] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9e3a3a]"
            >
              {isPending ? t.buying : purchaseButtonLabel}
              <ExternalLink size={16} strokeWidth={1.8} />
            </button>
            {error ? (
              <p className="text-sm leading-6 text-[#b64040]">{error}</p>
            ) : null}
          </div>
        ) : purchaseMode === "native_store" ? (
          <div className="space-y-4">
            {hasStoreConfiguration ? (
              <>
                <p className="text-sm leading-6 text-[#6b5d50]">{t.nativeOnly}</p>
                <NativeEbookPurchaseButton
                  appleStoreProductId={appleStoreProductId}
                  googleStoreProductId={googleStoreProductId}
                  language={language}
                />
                <div className="inline-flex rounded-full border border-[#decfbe] bg-[#fcf6f1] px-4 py-2 text-sm font-medium text-[#8a5f49]">
                  {t.nativeBadge}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm leading-6 text-[#6b5d50]">{t.nativeMissing}</p>
                <div className="inline-flex rounded-full border border-[#decfbe] bg-[#fcf6f1] px-4 py-2 text-sm font-medium text-[#8a5f49]">
                  {t.nativeBadge}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[#6b5d50]">
              {developmentPurchaseText || t.purchaseDisabled}
            </p>
            <div className="inline-flex rounded-full border border-[#decfbe] bg-[#fcf6f1] px-4 py-2 text-sm font-medium text-[#8a5f49]">
              {developmentCalloutLabel || t.purchaseDisabled}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
