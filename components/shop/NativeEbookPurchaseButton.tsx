"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import {
  PRODUCT_CATEGORY,
  Purchases,
  type PurchasesStoreProduct,
} from "@revenuecat/purchases-capacitor";
import {
  resolveBaseUiLanguage,
  type BaseUiLanguage,
  type UiLanguage,
} from "@/lib/i18n/runtime";
import { getPublicAppMessages } from "@/lib/i18n/publicAppMessages";

const COPY: Record<
  BaseUiLanguage,
  {
    loading: string;
    buying: string;
    ready: string;
    buyFallback: string;
    success: string;
    unavailable: string;
  }
> = {
  nl: {
    loading: "Productinformatie laden...",
    buying: "Aankoop starten...",
    ready: "Open de native app om dit e-book direct via Apple of Google te kopen.",
    buyFallback: "Koop in app",
    success:
      "Aankoop voltooid. Je toegang wordt gekoppeld aan je account. Dit kan een paar seconden duren.",
    unavailable: "Store-product is nog niet beschikbaar op dit apparaat.",
  },
  en: {
    loading: "Loading product information...",
    buying: "Starting purchase...",
    ready: "Open the native app to buy this ebook directly through Apple or Google.",
    buyFallback: "Buy in app",
    success:
      "Purchase completed. Access is being linked to your account. This may take a few seconds.",
    unavailable: "This store product is not available on this device yet.",
  },
  de: {
    loading: "Produktinformationen werden geladen...",
    buying: "Kauf wird gestartet...",
    ready:
      "Öffne die native App, um dieses E-Book direkt über Apple oder Google zu kaufen.",
    buyFallback: "In App kaufen",
    success:
      "Kauf abgeschlossen. Der Zugriff wird deinem Konto zugeordnet. Das kann ein paar Sekunden dauern.",
    unavailable: "Dieses Store-Produkt ist auf diesem Gerät noch nicht verfügbar.",
  },
};

function getStoreProductId(appleStoreProductId: string, googleStoreProductId: string) {
  const platform = Capacitor.getPlatform();

  if (platform === "ios") {
    return appleStoreProductId.trim() || null;
  }

  if (platform === "android") {
    return googleStoreProductId.trim() || null;
  }

  return null;
}

export default function NativeEbookPurchaseButton({
  appleStoreProductId,
  googleStoreProductId,
  language,
}: {
  appleStoreProductId: string;
  googleStoreProductId: string;
  language: UiLanguage;
}) {
  const t = COPY[resolveBaseUiLanguage(language)];
  const purchaseMessages = getPublicAppMessages(language).ebookPurchase;
  const router = useRouter();
  const [product, setProduct] = useState<PurchasesStoreProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const storeProductId = useMemo(
    () => getStoreProductId(appleStoreProductId, googleStoreProductId),
    [appleStoreProductId, googleStoreProductId]
  );

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !storeProductId) {
      return;
    }

    let cancelled = false;

    const loadProduct = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { products } = await Purchases.getProducts({
          productIdentifiers: [storeProductId],
          type: PRODUCT_CATEGORY.NON_SUBSCRIPTION,
        });

        if (!cancelled) {
          setProduct(products[0] ?? null);
          if (!products[0]) {
            setError(t.unavailable);
          }
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(
            nextError instanceof Error ? nextError.message : t.unavailable
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [storeProductId, t.unavailable]);

  if (!Capacitor.isNativePlatform() || !storeProductId) {
    return null;
  }

  const buttonLabel = product?.priceString
    ? `${t.buyFallback} ${product.priceString}`
    : t.buyFallback;

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-[#6b5d50]">{t.ready}</p>
      <button
        type="button"
        disabled={!product || isLoading || isPending}
        onClick={() =>
          startTransition(async () => {
            if (!product) return;

            setError(null);
            setSuccess(null);

            try {
              await Purchases.purchaseStoreProduct({ product });
              setSuccess(t.success);
              setTimeout(() => {
                router.refresh();
              }, 2500);
            } catch (nextError) {
              const message =
                nextError instanceof Error
                  ? nextError.message
                  : purchaseMessages.fallbackError;

              if (!/cancel/i.test(message)) {
                setError(message || purchaseMessages.fallbackError);
              }
            }
          })
        }
        className="inline-flex items-center gap-2 rounded-full border border-[#9e3a3a] bg-[#b64040] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9e3a3a] disabled:cursor-not-allowed disabled:border-[#d6c6b7] disabled:bg-[#e7ddd4] disabled:text-[#8f7d6f]"
      >
        {isPending ? t.buying : isLoading ? t.loading : buttonLabel}
      </button>
      {error ? <p className="text-sm leading-6 text-[#b64040]">{error}</p> : null}
      {success ? (
        <p className="text-sm leading-6 text-[#6b5d50]">{success}</p>
      ) : null}
    </div>
  );
}
