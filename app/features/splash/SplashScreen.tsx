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
      className={`fixed inset-0 z-[100] overflow-hidden bg-[radial-gradient(circle_at_top,#faf3ea_0%,#f2e6dc_45%,#ebddd6_100%)] px-0 py-0 text-stone-900 transition-all duration-500 ease-out motion-reduce:transition-none sm:px-4 sm:py-5 ${
        isClosing
          ? "pointer-events-none opacity-0 blur-[2px]"
          : "opacity-100 blur-0"
      }`}
    >
      <div className="mx-auto flex h-full w-full max-w-md items-stretch justify-center">
        <div className="flex h-full w-full flex-col overflow-hidden border-0 bg-[linear-gradient(180deg,#fbf3e7_0%,#faf5ef_58%,#edd7d2_100%)] px-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] pt-[calc(env(safe-area-inset-top,0px)+1rem)] text-center shadow-none sm:rounded-[2.25rem] sm:border sm:border-[#e7d9cf] sm:px-8 sm:pb-10 sm:pt-5 sm:shadow-[0_32px_90px_rgba(61,42,33,0.18)]">
          <div className="mx-auto flex w-full max-w-[18rem] flex-1 flex-col items-center justify-center">
            <div className="flex w-full justify-center">
              {splashImageUrl ? (
                <Image
                  src={splashImageUrl}
                  alt="Splash afbeelding"
                  width={406}
                  height={319}
                  sizes="(max-width: 768px) 16rem, 16rem"
                  unoptimized
                  className="h-auto max-h-[min(36vh,17rem)] w-full max-w-[min(65vw,15rem)] object-contain sm:max-h-[31.5rem] sm:max-w-[16rem]"
                  priority
                />
              ) : (
                <Image
                  src={logo}
                  alt="Pure Therapeutic Art logo"
                  className="h-auto max-h-[min(36vh,17rem)] w-full max-w-[min(65vw,15rem)] object-contain sm:max-h-[31.5rem] sm:max-w-[16rem]"
                  priority
                />
              )}
            </div>

            <h1 className="mt-2 font-serif text-[clamp(2rem,8vw,2.5rem)] leading-[0.94] tracking-[-0.03em] text-stone-700">
              <span className="block">Pure Grief</span>
              <span className="mt-1 block">and</span>
              <span className="mt-1 block">Therapeutic</span>
              <span className="mt-1 block">ART</span>
            </h1>

            <div className="mt-5 flex items-center justify-center">
              <div
                className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#9fb29c] border-r-[#8f372f] motion-reduce:animate-none sm:h-10 sm:w-10"
                role="status"
                aria-label="App wordt geladen"
              />
            </div>

            <p className="splash-slogan mt-4 whitespace-pre-line text-[clamp(1.15rem,4.8vw,1.5rem)] leading-tight">
              &ldquo;{splashSlogan}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
