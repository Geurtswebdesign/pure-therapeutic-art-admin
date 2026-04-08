"use client";

import { useState } from "react";
import Link from "next/link";
import type { CreditTransaction, CreditWallet } from "@/lib/credits/types";
import CreditOverview from "@/components/users/CreditOverview";
import CreditTransactions from "@/components/users/CreditTransactions";
import AccountProfileForm from "@/components/account/AccountProfileForm";
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";
import {
  getEffectiveAccountType,
  getProfileAccountType,
  getTherapistProfileData,
  type AppProfileData,
} from "@/lib/users/accountTypes";

type UnlockItem = {
  id: string;
  credits_spent: number;
  unlocked_at: string;
  content_item: {
    title: string;
    slug: string | null;
    categories: string[];
  } | null;
};

type Props = {
  userId: string;
  role: string;
  displayName: string;
  email: string;
  bio: string;
  profileData?: AppProfileData | null;
  wallet: CreditWallet;
  transactions: CreditTransaction[];
  unlockedContent: UnlockItem[];
  language: UiLanguage;
};

type Tab = "overview" | "profile" | "credits" | "unlocked" | "therapist";

function labelForAccountType(
  accountType: "admin" | "user" | "client" | "therapist",
  t: ReturnType<typeof getAppMessages>["accountTabs"]
) {
  if (accountType === "therapist") return t.roleTherapist;
  if (accountType === "admin") return t.roleAdmin;
  if (accountType === "client") return t.roleClient;
  return t.roleUser;
}

export default function AccountTabs({
  userId,
  role,
  displayName,
  email,
  bio,
  profileData,
  wallet,
  transactions,
  unlockedContent,
  language,
}: Props) {
  const t = getAppMessages(language).accountTabs;
  const locale = language === "en" ? "en-US" : language === "de" ? "de-DE" : "nl-NL";
  const accountType = getEffectiveAccountType(role, profileData ?? null);
  const userAccountType = getProfileAccountType(profileData ?? null);
  const therapistProfile = getTherapistProfileData(profileData ?? null);
  const isTherapist = accountType === "therapist";
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b pb-2">
        <button
          onClick={() => setTab("overview")}
          className={`rounded px-3 py-1 text-sm ${tab === "overview" ? "bg-black text-white" : "bg-white border"}`}
        >
          {t.overview}
        </button>
        <button
          onClick={() => setTab("profile")}
          className={`rounded px-3 py-1 text-sm ${tab === "profile" ? "bg-black text-white" : "bg-white border"}`}
        >
          {t.profile}
        </button>
        <button
          onClick={() => setTab("credits")}
          className={`rounded px-3 py-1 text-sm ${tab === "credits" ? "bg-black text-white" : "bg-white border"}`}
        >
          {t.credits}
        </button>
        <button
          onClick={() => setTab("unlocked")}
          className={`rounded px-3 py-1 text-sm ${tab === "unlocked" ? "bg-black text-white" : "bg-white border"}`}
        >
          {t.unlocked}
        </button>
        {isTherapist ? (
          <button
            onClick={() => setTab("therapist")}
            className={`rounded px-3 py-1 text-sm ${tab === "therapist" ? "bg-black text-white" : "bg-white border"}`}
          >
            {t.clients}
          </button>
        ) : null}
      </div>

      {tab === "overview" ? (
        <section className="rounded border bg-white p-4 space-y-3">
          <h2 className="text-lg font-semibold">{t.welcome}, {displayName || email}</h2>
          <p className="text-sm text-gray-600">
            {t.accountType}: {labelForAccountType(accountType, t)}
          </p>
          <p className="text-sm text-gray-600">{t.availableCredits}: {wallet.credits_available}</p>
          <p className="text-sm text-gray-600">{t.unlockedItems}: {unlockedContent.length}</p>
        </section>
      ) : null}

      {tab === "profile" ? (
        <AccountProfileForm
          userId={userId}
          accountType={userAccountType}
          hasTherapistDirectoryAccess={false}
          initialDisplayName={displayName}
          initialBio={bio}
          initialFirstName={profileData?.first_name ?? ""}
          initialLastName={profileData?.last_name ?? ""}
          initialWebsite={profileData?.website ?? ""}
          initialAvatarUrl={profileData?.avatar_url ?? ""}
          initialTherapistProfile={therapistProfile}
          email={email}
          language={language}
        />
      ) : null}

      {tab === "credits" ? (
        <div className="space-y-4">
          <CreditOverview wallet={wallet} language={language} />
          <CreditTransactions transactions={transactions} language={language} />
        </div>
      ) : null}

      {tab === "unlocked" ? (
        <section className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">{t.unlockedTitle}</h2>
          {unlockedContent.length === 0 ? (
            <p className="text-sm text-gray-500">{t.noUnlocked}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left">{t.titleCol}</th>
                  <th className="px-2 py-2 text-left">{t.categoryCol}</th>
                  <th className="px-2 py-2 text-center">{t.creditsCol}</th>
                  <th className="px-2 py-2 text-center">{t.dateCol}</th>
                </tr>
              </thead>
              <tbody>
                {unlockedContent.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-2 py-2">
                      {item.content_item?.slug ? (
                        <Link href={`/content/${item.content_item.slug}`} className="text-blue-600 hover:underline">
                          {item.content_item.title}
                        </Link>
                      ) : (
                        <span className="text-gray-500">{t.unknownContent}</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {item.content_item?.categories?.length
                        ? item.content_item.categories.join(", ")
                        : "—"}
                    </td>
                    <td className="px-2 py-2 text-center">{item.credits_spent}</td>
                    <td className="px-2 py-2 text-center">
                      {new Date(item.unlocked_at).toLocaleDateString(locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {tab === "therapist" ? (
        <section className="rounded border bg-white p-4 space-y-2">
          <h2 className="text-lg font-semibold">{t.therapistTitle}</h2>
          <p className="text-sm text-gray-600">
            {t.therapistDesc}
          </p>
        </section>
      ) : null}
    </div>
  );
}
