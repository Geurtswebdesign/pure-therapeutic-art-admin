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
    login: string;
    buy: string;
    loading: string;
  }
> = {
  nl: {
    login:
      "Tik op deze kaart om in te loggen en dit abonnement in de app te activeren.",
    buy: "Tik op deze kaart om dit abonnement in de app te activeren.",
    loading: "Abonnement laden...",
  },
  en: {
    login: "Tap this card to sign in and activate this subscription in the app.",
    buy: "Tap this card to activate this subscription in the app.",
    loading: "Loading subscription...",
  },
  de: {
    login:
      "Tippe auf diese Karte, um dich anzumelden und dieses Abonnement in der App zu aktivieren.",
    buy: "Tippe auf diese Karte, um dieses Abonnement in der App zu aktivieren.",
    loading: "Abonnement wird geladen...",
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
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const storeProductId = useMemo(
    () => getStoreProductId(appleStoreProductId, googleStoreProductId),
    [appleStoreProductId, googleStoreProductId]
  );
  const isNativePlatform = Capacitor.isNativePlatform();
  const subscriptionOption = product ? getPreferredSubscriptionOption(product) : null;

  useEffect(() => {
    if (!isNativePlatform) {
      return;
    }

    if (!storeProductId) {
      setProduct(null);
      return;
    }

    let cancelled = false;

    const loadProduct = async () => {
      setIsLoading(true);

      try {
        const { products } = await Purchases.getProducts({
          productIdentifiers: [storeProductId],
          type: PRODUCT_CATEGORY.SUBSCRIPTION,
        });

        if (!cancelled) {
          setProduct(products[0] ?? null);
        }
      } catch (nextError) {
        if (!cancelled && nextError instanceof Error) {
          console.error("Native subscription product load failed", nextError);
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
  }, [isNativePlatform, storeProductId]);

  if (!isNativePlatform) {
    return <div className={className}>{children}</div>;
  }

  const actionHint = isLoggedIn
    ? isLoading || isPending || !product
      ? t.loading
      : t.buy
    : t.login;

  const content = (
    <div className="space-y-3">
      {children}
      <div className="text-xs font-medium text-[#8a5f49]">{actionHint}</div>
    </div>
  );

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
            setTimeout(() => {
              router.refresh();
            }, 2500);
          } catch (nextError) {
            if (nextError instanceof Error && !/cancel/i.test(nextError.message)) {
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
    >
      {content}
    </button>
  );
}
