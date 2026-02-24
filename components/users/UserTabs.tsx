"use client";

import { useState } from "react";

import type {
  CreditWallet,
  CreditTransaction,
} from "@/lib/credits/types";

import type {AdminUserProfile} from "@/lib/users/getUserDetail";
import UserGeneralTab from "@/components/users/UserGeneralTab";
import UserCreditsTab from "@/components/users/UserCreditsTab";
import UserUnlockedTab from "@/components/users/UserUnlockedTab";
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Props = {
  language: UiLanguage;
  user: AdminUserProfile;
  wallet: CreditWallet;
  transactions: CreditTransaction[];
  unlockedContent: {
    id: string;
    credits_spent: number;
    unlocked_at: string;
    content_item: {
      id: string;
      title: string;
      slug: string;
      credit_cost: number;
      categories: string[];
    } | null;
  }[];
  yearEntitlements: {
    id: string;
    entitlement_key: string;
    starts_at: string;
    ends_at: string | null;
    is_active: boolean;
    created_at: string;
  }[];
  currentAdminId: string;
  isSuperAdmin: boolean;
};

type Tab = "general" | "credits" | "unlocked";

export default function UserTabs({
  language,
  user,
  wallet,
  transactions,
  unlockedContent,
  yearEntitlements,
  currentAdminId,
  isSuperAdmin, // ✅ NU BESTAAT HIJ
}: Props) {
  const t = getAppMessages(language).userTabs;
  const [tab, setTab] = useState<Tab>("general");

  return (
    <div className="space-y-6">
      {/* TAB NAV */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setTab("general")}
          className={`pb-2 text-sm ${
            tab === "general"
              ? "border-b-2 border-black font-semibold"
              : "text-gray-500"
          }`}
        >
          {t.general}
        </button>

        <button
          onClick={() => setTab("credits")}
          className={`pb-2 text-sm ${
            tab === "credits"
              ? "border-b-2 border-black font-semibold"
              : "text-gray-500"
          }`}
        >
          {t.credits}
        </button>

        <button
          onClick={() => setTab("unlocked")}
          className={`pb-2 text-sm ${
            tab === "unlocked"
              ? "border-b-2 border-black font-semibold"
              : "text-gray-500"
          }`}
        >
          {t.unlocked}
        </button>
      </div>

      {/* TAB CONTENT */}
      {tab === "general" && <UserGeneralTab user={user} language={language} />}

      {tab === "credits" && (
        <UserCreditsTab
          userId={user.user_id}
          wallet={wallet}
          transactions={transactions}
          yearEntitlements={yearEntitlements}
          isSelf={currentAdminId === user.user_id}
          isSuperAdmin={isSuperAdmin}
          language={language}
        />
      )}

      {tab === "unlocked" && (
        <UserUnlockedTab items={unlockedContent} language={language} />
      )}
    </div>
  );
}
