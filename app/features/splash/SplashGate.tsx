"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  SPLASH_SEEN_COOKIE_NAME,
  SPLASH_SEEN_SESSION_KEY,
} from "./constants";
import SplashScreen from "./SplashScreen";

const DEFAULT_SPLASH_DURATION_MS = 5000;
const EXIT_ANIMATION_MS = 500;

type SplashGateProps = {
  children: ReactNode;
  disableSplash?: boolean;
  durationMs?: number;
  imageUrl?: string | null;
  initiallySeen?: boolean;
  slogan?: string;
};

type SplashPhase = "visible" | "closing" | "hidden";

function isAdminRoute(pathname: string | null) {
  if (!pathname) return false;
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export default function SplashGate({
  children,
  disableSplash = false,
  durationMs = DEFAULT_SPLASH_DURATION_MS,
  imageUrl = null,
  initiallySeen = false,
  slogan,
}: SplashGateProps) {
  const pathname = usePathname();
  const hideSplash = disableSplash || initiallySeen || isAdminRoute(pathname);
  const [phase, setPhase] = useState<SplashPhase>(() =>
    hideSplash ? "hidden" : "visible"
  );
  const previousOverflow = useRef<string | null>(null);
  const splashMarkedSeen = useRef(false);

  useEffect(() => {
    if (!hideSplash) return;
    setPhase("hidden");
  }, [hideSplash]);

  useEffect(() => {
    if (hideSplash || splashMarkedSeen.current) {
      return;
    }

    splashMarkedSeen.current = true;
    document.cookie = `${SPLASH_SEEN_COOKIE_NAME}=1; path=/; SameSite=Lax`;

    try {
      window.sessionStorage.setItem(SPLASH_SEEN_SESSION_KEY, "1");
    } catch {
      // Ignore session storage availability issues.
    }
  }, [hideSplash]);

  useEffect(() => {
    if (hideSplash) {
      return undefined;
    }

    const closeTimer = window.setTimeout(() => {
      setPhase("closing");
    }, durationMs);

    const hideTimer = window.setTimeout(() => {
      setPhase("hidden");
    }, durationMs + EXIT_ANIMATION_MS);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [durationMs, hideSplash]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    if (previousOverflow.current === null) {
      previousOverflow.current = document.body.style.overflow;
    }

    document.body.style.overflow =
      phase === "hidden" ? previousOverflow.current : "hidden";

    return () => {
      document.body.style.overflow = previousOverflow.current ?? "";
    };
  }, [phase]);

  return (
    <>
      {children}
      {phase === "hidden" ? null : (
        <SplashScreen
          imageUrl={imageUrl}
          isClosing={phase === "closing"}
          slogan={slogan}
        />
      )}
    </>
  );
}
