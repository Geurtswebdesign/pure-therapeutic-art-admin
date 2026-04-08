"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import {
  PRODUCT_CATEGORY,
  Purchases,
  type PurchasesStoreProduct,
} from "@revenuecat/purchases-capacitor";
import type { UiLanguage } from "@/lib/i18n/runtime";

const COPY: Record<
  UiLanguage,
  {
    login: string;
    signIn: string;
    buy: string;
  }
> = {
  nl: {
    login: "Log in om dit pakket in de app te kopen.",
    signIn: "Log in",
    buy: "Kopen",
  },
  en: {
    login: "Log in to buy this pack in the app.",
    signIn: "Log in",
    buy: "Buy",
  },
  de: {
    login: "Melde dich an, um dieses Paket in der App zu kaufen.",
    signIn: "Anmelden",
    buy: "Kaufen",
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

export default function NativeCreditPackPurchaseButton({
  appleStoreProductId,
  googleStoreProductId,
  isLoggedIn,
  language,
}: {
  appleStoreProductId: string;
  googleStoreProductId: string;
  isLoggedIn: boolean;
  language: UiLanguage;
}) {
  const t = COPY[language] ?? COPY.nl;
  const router = useRouter();
  const [product, setProduct] = useState<PurchasesStoreProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const storeProductId = useMemo(
    () => getStoreProductId(appleStoreProductId, googleStoreProductId),
    [appleStoreProductId, googleStoreProductId]
  );

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
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
          type: PRODUCT_CATEGORY.NON_SUBSCRIPTION,
        });

        if (!cancelled) {
          setProduct(products[0] ?? null);
        }
      } catch (nextError) {
        if (!cancelled && nextError instanceof Error) {
          console.error("Native credit pack product load failed", nextError);
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
  }, [storeProductId]);

  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <div className="space-y-3">
        <p className="text-sm leading-6 text-[#6b5d50]">{t.login}</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full border border-[#9e3a3a] bg-[#b64040] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9e3a3a]"
        >
          {t.signIn}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={!product || isLoading || isPending}
        onClick={() =>
          startTransition(async () => {
            if (!product) {
              return;
            }

            try {
              await Purchases.purchaseStoreProduct({ product });
              setTimeout(() => {
                router.refresh();
              }, 2500);
            } catch (nextError) {
              if (nextError instanceof Error && !/cancel/i.test(nextError.message)) {
                console.error("Native credit pack purchase failed", nextError);
              }
            }
          })
        }
        className="inline-flex items-center gap-2 rounded-full border border-[#9e3a3a] bg-[#b64040] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#9e3a3a] disabled:cursor-not-allowed disabled:border-[#d6c6b7] disabled:bg-[#e7ddd4] disabled:text-[#8f7d6f]"
      >
        {t.buy}
      </button>
    </div>
  );
}
