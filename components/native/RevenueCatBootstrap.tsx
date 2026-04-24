"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import {
  ENTITLEMENT_VERIFICATION_MODE,
  Purchases,
  STOREKIT_VERSION,
} from "@revenuecat/purchases-capacitor";

function getRevenueCatApiKey() {
  const platform = Capacitor.getPlatform();

  if (platform === "ios") {
    return process.env.NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY?.trim() || null;
  }

  if (platform === "android") {
    return process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY?.trim() || null;
  }

  return null;
}

function getMissingApiKeyMessage(platform: string) {
  if (platform === "ios") {
    return "RevenueCat bootstrap skipped: missing NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY.";
  }

  if (platform === "android") {
    return "RevenueCat bootstrap skipped: missing NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY.";
  }

  return "RevenueCat bootstrap skipped: missing native RevenueCat API key.";
}

export function RevenueCatBootstrap({
  disabled,
  userId,
}: {
  disabled: boolean;
  userId: string | null;
}) {
  useEffect(() => {
    if (disabled || !userId || !Capacitor.isNativePlatform()) {
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      const platform = Capacitor.getPlatform();
      const apiKey = getRevenueCatApiKey();
      if (!apiKey) {
        console.error(getMissingApiKeyMessage(platform));
        return;
      }

      try {
        const { isConfigured } = await Purchases.isConfigured().catch(() => ({
          isConfigured: false,
        }));

        if (!isConfigured) {
          await Purchases.configure({
            apiKey,
            appUserID: userId,
            storeKitVersion: STOREKIT_VERSION.DEFAULT,
            entitlementVerificationMode:
              ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL,
          });
          return;
        }

        const { appUserID } = await Purchases.getAppUserID();
        if (!cancelled && appUserID !== userId) {
          await Purchases.logIn({ appUserID: userId });
        }
      } catch (error) {
        console.error("RevenueCat bootstrap failed", error);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [disabled, userId]);

  return null;
}
