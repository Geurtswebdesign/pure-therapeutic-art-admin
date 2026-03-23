import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/frontend.css";

import { WalletProvider } from "@/components/providers/WalletProvider";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getWallet } from "@/lib/credits/getWallet";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import TrackPageView from "@/components/analytics/TrackPageView";
import { SplashGate } from "@/app/features/splash";
import { getPublicSplashSettings } from "@/lib/settings/public";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, appLanguage, splashSettings] = await Promise.all([
    getCurrentUser(),
    getAppLanguage(),
    getPublicSplashSettings(),
  ]);

  let balance = 0;

  if (user) {
    const wallet = await getWallet(user.id);
    balance = wallet?.credits_available ?? 0;
  }

  return (
    <html lang={appLanguage}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletProvider initialBalance={balance}>
          <SplashGate
            imageUrl={splashSettings.imageUrl}
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
