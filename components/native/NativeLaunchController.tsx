"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

export function NativeLaunchController({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled || !Capacitor.isNativePlatform()) {
      return;
    }

    let cancelled = false;
    let hideTimer: number | null = null;

    const hideSplash = () => {
      hideTimer = window.setTimeout(() => {
        if (cancelled) {
          return;
        }

        void SplashScreen.hide().catch(() => {
          // Ignore native splash hide failures.
        });
      }, 150);
    };

    if (document.readyState === "complete") {
      hideSplash();
    } else {
      window.addEventListener("load", hideSplash, { once: true });
    }

    return () => {
      cancelled = true;
      if (hideTimer !== null) {
        window.clearTimeout(hideTimer);
      }
      window.removeEventListener("load", hideSplash);
    };
  }, [enabled]);

  return null;
}
