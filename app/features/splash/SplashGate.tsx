"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import SplashScreen from "./SplashScreen";

const DEFAULT_SPLASH_DURATION_MS = 5000;
const EXIT_ANIMATION_MS = 500;

type SplashGateProps = {
  children: ReactNode;
  durationMs?: number;
  imageUrl?: string | null;
  slogan?: string;
};

type SplashPhase = "visible" | "closing" | "hidden";

export default function SplashGate({
  children,
  durationMs = DEFAULT_SPLASH_DURATION_MS,
  imageUrl = null,
  slogan,
}: SplashGateProps) {
  const [phase, setPhase] = useState<SplashPhase>("visible");
  const previousOverflow = useRef<string | null>(null);

  useEffect(() => {
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
  }, [durationMs]);

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
