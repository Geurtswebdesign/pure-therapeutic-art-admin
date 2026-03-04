import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";

import { WalletProvider } from "@/components/providers/WalletProvider";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getWallet } from "@/lib/credits/getWallet";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import TrackPageView from "@/components/analytics/TrackPageView";

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
  const user = await getCurrentUser();

  let balance = 0;

  if (user) {
    const wallet = await getWallet(user.id);
    balance = wallet?.credits_available ?? 0;
  }
  const primaryLanguage = await getPrimaryLanguage();

  return (
    <html lang={primaryLanguage}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletProvider initialBalance={balance}>
          <TrackPageView />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
