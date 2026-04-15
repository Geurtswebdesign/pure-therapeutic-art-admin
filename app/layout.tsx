import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/frontend.css";

import { WalletProvider } from "@/components/providers/WalletProvider";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getWallet } from "@/lib/credits/getWallet";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import TrackPageView from "@/components/analytics/TrackPageView";
import { SplashGate } from "@/app/features/splash";
import { SPLASH_SEEN_COOKIE_NAME } from "@/app/features/splash/constants";
import { RevenueCatBootstrap } from "@/components/native/RevenueCatBootstrap";
import { NativeLaunchController } from "@/components/native/NativeLaunchController";
import { getPublicSplashSettings } from "@/lib/settings/public";
import { isNativeAppUserAgent } from "@/lib/native/isNativeAppRequest";
import { getRequestHost, isAdminHost } from "@/lib/site/urls";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pure Therapeutic ART Therapy",
  description: "Hier komt een beschrijving van de app te staan.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, appLanguage, splashSettings, requestHeaders, cookieStore] =
    await Promise.all([
    getCurrentUser(),
    getAppLanguage(),
    getPublicSplashSettings(),
    headers(),
    cookies(),
  ]);

  const requestHost = getRequestHost(requestHeaders);
  const isNativeApp = isNativeAppUserAgent(requestHeaders.get("user-agent"));
  const splashSeen = cookieStore.get(SPLASH_SEEN_COOKIE_NAME)?.value === "1";
  const disableSplash = isAdminHost(requestHost) || isNativeApp;
  const initiallySeen = isNativeApp ? false : splashSeen;

  let balance = 0;

  if (user) {
    const wallet = await getWallet(user.id);
    balance = wallet?.credits_available ?? 0;
  }

  return (
    <html className={isNativeApp ? "native-app" : undefined} lang={appLanguage}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${isNativeApp ? "native-app" : ""} antialiased`}
      >
        <WalletProvider initialBalance={balance}>
          <NativeLaunchController enabled={isNativeApp} />
          <RevenueCatBootstrap
            disabled={isAdminHost(requestHost)}
            userId={user?.id ?? null}
          />
          <SplashGate
            disableSplash={disableSplash}
            imageUrl={splashSettings.imageUrl}
            initiallySeen={initiallySeen}
            preferBundledImage={isNativeApp}
            slogan={splashSettings.slogan}
          >
            <TrackPageView />
            {children}
          </SplashGate>
        </WalletProvider>
      </body>
    </html>
  );
}
