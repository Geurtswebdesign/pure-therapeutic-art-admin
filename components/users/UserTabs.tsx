"use client";

import { useState } from "react";

import type {
  AdminUserProfile,
  CreditWallet,
  CreditTransaction,
} from "@/lib/credits/types";

import UserGeneralTab from "@/components/users/UserGeneralTab";
import UserCreditsTab from "@/components/users/UserCreditsTab";

type Props = {
  user: AdminUserProfile;
  wallet: CreditWallet;
  transactions: CreditTransaction[];
  currentAdminId: string;
  isSuperAdmin: boolean;
};

type Tab = "general" | "credits";

export default function UserTabs({
  user,
  wallet,
  transactions,
  currentAdminId,
  isSuperAdmin, // ✅ NU BESTAAT HIJ
}: Props) {
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
          Algemeen
        </button>

        <button
          onClick={() => setTab("credits")}
          className={`pb-2 text-sm ${
            tab === "credits"
              ? "border-b-2 border-black font-semibold"
              : "text-gray-500"
          }`}
        >
          Credits
        </button>
      </div>

      {/* TAB CONTENT */}
      {tab === "general" && <UserGeneralTab user={user} />}

      {tab === "credits" && (
        <UserCreditsTab
          userId={user.user_id}
          wallet={wallet}
          transactions={transactions}
          isSelf={currentAdminId === user.user_id}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </div>
  );
}
