"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import {
  PRODUCT_CATEGORY,
  Purchases,
  type PurchasesStoreProduct,
  type SubscriptionOption,
} from "@revenuecat/purchases-capacitor";
import {
  resolveBaseUiLanguage,
  type BaseUiLanguage,
  type UiLanguage,
} from "@/lib/i18n/runtime";

const COPY: Record<
  BaseUiLanguage,
  {
    loading: string;
    initializing: string;
    setupUnavailable: string;
    missingStoreProduct: string;
    productUnavailable: string;
  }
> = {
  nl: {
    loading: "Abonnement laden...",
    initializing: "Apple of Google wordt nog gekoppeld voor dit abonnement...",
    setupUnavailable:
      "De store-koppeling is in deze build nog niet actief. Controleer RevenueCat en maak daarna zo nodig een nieuwe build.",
    missingStoreProduct:
      "Voor dit abonnement ontbreekt nog de store product-id voor dit platform.",
    productUnavailable:
      "Dit store-product is nog niet beschikbaar op dit apparaat.",
  },
  en: {
    loading: "Loading subscription...",
    initializing: "Apple or Google is still being connected for this subscription...",
    setupUnavailable:
      "The store connection is not active in this build yet. Check RevenueCat and create a new build if needed.",
    missingStoreProduct:
      "This subscription is still missing the store product ID for this platform.",
    productUnavailable:
      "This store product is not available on this device yet.",
  },
  de: {
    loading: "Abonnement wird geladen...",
    initializing: "Apple oder Google wird fur dieses Abonnement noch verbunden...",
    setupUnavailable:
      "Die Store-Anbindung ist in diesem Build noch nicht aktiv. Prufe RevenueCat und erstelle notfalls einen neuen Build.",
    missingStoreProduct:
      "Fur dieses Abonnement fehlt noch die Store-Produkt-ID fur diese Plattform.",
    productUnavailable:
      "Dieses Store-Produkt ist auf diesem Gerat noch nicht verfugbar.",
  },
};

const MAX_BOOTSTRAP_RETRIES = 5;

function shouldRetryRevenueCatLoad(message: string) {
  return /singleton|configure|configured|not initialized|not set up/i.test(message);
}

function getStoreProductIssueMessage(
  platform: string,
  storeProductId: string,
  t: (typeof COPY)[BaseUiLanguage]
) {
  const storeLabel = platform === "ios" ? "Apple" : platform === "android" ? "Google" : "Store";
  return `${t.productUnavailable} ${storeLabel} product-id: ${storeProductId}.`;
}

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

function getPreferredSubscriptionOption(product: PurchasesStoreProduct) {
  return (
    product.defaultOption ??
    product.subscriptionOptions?.find((option) => option.isBasePlan) ??
    product.subscriptionOptions?.[0] ??
    null
  );
}

async function purchaseSubscriptionProduct(
  product: PurchasesStoreProduct,
  subscriptionOption: SubscriptionOption | null
) {
  if (Capacitor.getPlatform() === "android" && subscriptionOption) {
    await Purchases.purchaseSubscriptionOption({ subscriptionOption });
    return;
  }

  await Purchases.purchaseStoreProduct({ product });
}

export default function NativeSubscriptionPurchaseSurface({
  appleStoreProductId,
  children,
  className,
  googleStoreProductId,
  isLoggedIn,
  language,
  loginHref = "/login",
}: {
  appleStoreProductId: string;
  children: ReactNode;
  className: string;
  googleStoreProductId: string;
  isLoggedIn: boolean;
  language: UiLanguage;
  loginHref?: string;
}) {
  const t = COPY[resolveBaseUiLanguage(language)];
  const router = useRouter();
  const [product, setProduct] = useState<PurchasesStoreProduct | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  const storeProductId = useMemo(
    () => getStoreProductId(appleStoreProductId, googleStoreProductId),
    [appleStoreProductId, googleStoreProductId]
  );
  const isNativePlatform = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const subscriptionOption = product ? getPreferredSubscriptionOption(product) : null;

  useEffect(() => {
    setRetryCount(0);
  }, [storeProductId]);

  useEffect(() => {
    if (!isNativePlatform) {
      return;
    }

    if (!storeProductId) {
      setProduct(null);
      setLoadError(t.missingStoreProduct);
      return;
    }

    let cancelled = false;
    let retryTimer: number | null = null;

    const scheduleRetry = () => {
      if (retryCount >= MAX_BOOTSTRAP_RETRIES) {
        setLoadError(t.setupUnavailable);
        return;
      }

      retryTimer = window.setTimeout(() => {
        if (!cancelled) {
          setRetryCount((current) => current + 1);
        }
      }, 1200);
    };

    const loadProduct = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const { isConfigured } = await Purchases.isConfigured().catch(() => ({
          isConfigured: false,
        }));

        if (!isConfigured) {
          if (!cancelled) {
            setProduct(null);
            setLoadError(
              retryCount >= MAX_BOOTSTRAP_RETRIES
                ? t.setupUnavailable
                : t.initializing
            );
            scheduleRetry();
          }
          return;
        }

        const { products } = await Purchases.getProducts({
          productIdentifiers: [storeProductId],
          type: PRODUCT_CATEGORY.SUBSCRIPTION,
        });

        if (!cancelled) {
          const nextProduct = products[0] ?? null;
          setProduct(nextProduct);
          setLoadError(
            nextProduct
              ? null
              : getStoreProductIssueMessage(platform, storeProductId, t)
          );
        }
      } catch (nextError) {
        if (!cancelled) {
          const message = nextError instanceof Error ? nextError.message : "";

          if (shouldRetryRevenueCatLoad(message)) {
            setProduct(null);
            setLoadError(
              retryCount >= MAX_BOOTSTRAP_RETRIES
                ? t.setupUnavailable
                : t.initializing
            );
            scheduleRetry();
          } else {
            setProduct(null);
            setLoadError(
              message || getStoreProductIssueMessage(platform, storeProductId, t)
            );
          }

          if (nextError instanceof Error) {
            console.error("Native subscription product load failed", nextError);
          }
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
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [isNativePlatform, platform, retryCount, storeProductId, t]);

  if (!isNativePlatform) {
    return <div className={className}>{children}</div>;
  }

  const content = children;

  if (!isLoggedIn) {
    return (
      <Link
        href={loginHref}
        className={`${className} block cursor-pointer text-left transition hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(57,41,28,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b64040]`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={!product || isLoading || isPending}
      onClick={() =>
        startTransition(async () => {
          if (!product) {
            return;
          }

          try {
            await purchaseSubscriptionProduct(product, subscriptionOption);
            setLoadError(null);
            setTimeout(() => {
              router.refresh();
            }, 2500);
          } catch (nextError) {
            if (nextError instanceof Error && !/cancel/i.test(nextError.message)) {
              setLoadError(nextError.message);
              console.error("Native subscription purchase failed", nextError);
            }
          }
        })
      }
      className={`${className} block w-full text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b64040] ${
        !product || isLoading || isPending
          ? "cursor-not-allowed opacity-80"
          : "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(57,41,28,0.12)]"
      }`}
      aria-label={isLoading || isPending || !product ? t.loading : undefined}
    >
      {content}
      {loadError ? (
        <span className="mt-3 block rounded-[1rem] border border-[#ead6c6] bg-white/90 px-3 py-2 text-xs leading-5 text-[#8a5f49]">
          {loadError}
        </span>
      ) : null}
    </button>
  );
}
