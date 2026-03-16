"use client";

import Image from "next/image";
import logo from "@/assets/branding/logo.png";
import { DEFAULT_CUSTOMIZER_SETTINGS } from "@/lib/settings/types";

type SplashScreenProps = {
  isClosing?: boolean;
  imageUrl?: string | null;
  slogan?: string;
};

export default function SplashScreen({
  isClosing = false,
  imageUrl = null,
  slogan,
}: SplashScreenProps) {
  const splashImageUrl = imageUrl?.trim() || null;
  const splashSlogan =
    slogan?.trim() || DEFAULT_CUSTOMIZER_SETTINGS.splashSlogan;

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden bg-[radial-gradient(circle_at_top,#faf3ea_0%,#f2e6dc_45%,#ebddd6_100%)] px-4 py-5 text-stone-900 transition-all duration-500 ease-out motion-reduce:transition-none ${
        isClosing
          ? "pointer-events-none opacity-0 blur-[2px]"
          : "opacity-100 blur-0"
      }`}
    >
      <div className="mx-auto flex min-h-full w-full max-w-md items-center justify-center">
        <div className="flex min-h-[calc(100dvh-2.5rem)] w-full flex-col overflow-hidden rounded-[2.25rem] border border-[#e7d9cf] bg-[linear-gradient(180deg,#fbf3e7_0%,#faf5ef_58%,#edd7d2_100%)] px-8 pb-10 pt-5 text-center shadow-[0_32px_90px_rgba(61,42,33,0.18)]">
          <div className="flex flex-col items-center">
            <div className="flex w-full justify-center">
              {splashImageUrl ? (
                <Image
                  src={splashImageUrl}
                  alt="Splash afbeelding"
                  width={406}
                  height={319}
                  unoptimized
                  className="h-auto max-h-[31.5rem] w-full max-w-[16rem] object-contain"
                  priority
                />
              ) : (
                <Image
                  src={logo}
                  alt="Pure Therapeutic Art logo"
                  className="h-auto max-h-[31.5rem] w-full max-w-[16rem] object-contain"
                  priority
                />
              )}
            </div>

            <h1 className="mt-2 font-serif text-[2.5rem] leading-[0.94] tracking-[-0.03em] text-stone-700">
              <span className="block">Pure Grief</span>
              <span className="mt-1 block">and</span>
              <span className="mt-1 block">Therapeutic</span>
              <span className="mt-1 block">ART</span>
            </h1>

            <div className="mt-5 flex items-center justify-center">
              <div
                className="h-[2.5rem] w-[2.5rem] animate-spin rounded-full border-[3px] border-[#9fb29c] border-r-[#8f372f] motion-reduce:animate-none"
                role="status"
                aria-label="App wordt geladen"
              />
            </div>

            <p className="splash-slogan mt-4 whitespace-pre-line">
              &ldquo;{splashSlogan}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
