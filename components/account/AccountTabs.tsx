"use client";

import { useState } from "react";
import Link from "next/link";
import type { CreditTransaction, CreditWallet } from "@/lib/credits/types";
import CreditOverview from "@/components/users/CreditOverview";
import CreditTransactions from "@/components/users/CreditTransactions";
import AccountProfileForm from "@/components/account/AccountProfileForm";

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
  role: string;
  displayName: string;
  email: string;
  bio: string;
  wallet: CreditWallet;
  transactions: CreditTransaction[];
  unlockedContent: UnlockItem[];
};

type Tab = "overview" | "profile" | "credits" | "unlocked" | "therapist";

function labelForRole(role: string) {
  if (role === "therapist") return "Therapeut";
  if (role === "admin") return "Beheerder";
  if (role === "client") return "Client";
  return "Gebruiker";
}

export default function AccountTabs({
  role,
  displayName,
  email,
  bio,
  wallet,
  transactions,
  unlockedContent,
}: Props) {
  const isTherapist = role === "therapist";
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b pb-2">
        <button
          onClick={() => setTab("overview")}
          className={`rounded px-3 py-1 text-sm ${tab === "overview" ? "bg-black text-white" : "bg-white border"}`}
        >
          Overzicht
        </button>
        <button
          onClick={() => setTab("profile")}
          className={`rounded px-3 py-1 text-sm ${tab === "profile" ? "bg-black text-white" : "bg-white border"}`}
        >
          Profiel
        </button>
        <button
          onClick={() => setTab("credits")}
          className={`rounded px-3 py-1 text-sm ${tab === "credits" ? "bg-black text-white" : "bg-white border"}`}
        >
          Credits
        </button>
        <button
          onClick={() => setTab("unlocked")}
          className={`rounded px-3 py-1 text-sm ${tab === "unlocked" ? "bg-black text-white" : "bg-white border"}`}
        >
          Ontgrendelde content
        </button>
        {isTherapist ? (
          <button
            onClick={() => setTab("therapist")}
            className={`rounded px-3 py-1 text-sm ${tab === "therapist" ? "bg-black text-white" : "bg-white border"}`}
          >
            Clienten
          </button>
        ) : null}
      </div>

      {tab === "overview" ? (
        <section className="rounded border bg-white p-4 space-y-3">
          <h2 className="text-lg font-semibold">Welkom, {displayName || email}</h2>
          <p className="text-sm text-gray-600">Accounttype: {labelForRole(role)}</p>
          <p className="text-sm text-gray-600">Beschikbare credits: {wallet.credits_available}</p>
          <p className="text-sm text-gray-600">Ontgrendelde items: {unlockedContent.length}</p>
        </section>
      ) : null}

      {tab === "profile" ? (
        <AccountProfileForm
          initialDisplayName={displayName}
          initialBio={bio}
          email={email}
        />
      ) : null}

      {tab === "credits" ? (
        <div className="space-y-4">
          <CreditOverview wallet={wallet} />
          <CreditTransactions transactions={transactions} />
        </div>
      ) : null}

      {tab === "unlocked" ? (
        <section className="rounded border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Ontgrendelde content</h2>
          {unlockedContent.length === 0 ? (
            <p className="text-sm text-gray-500">Nog geen ontgrendelde content.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left">Titel</th>
                  <th className="px-2 py-2 text-left">Categorie</th>
                  <th className="px-2 py-2 text-center">Credits</th>
                  <th className="px-2 py-2 text-center">Datum</th>
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
                        <span className="text-gray-500">Onbekende content</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {item.content_item?.categories?.length
                        ? item.content_item.categories.join(", ")
                        : "—"}
                    </td>
                    <td className="px-2 py-2 text-center">{item.credits_spent}</td>
                    <td className="px-2 py-2 text-center">
                      {new Date(item.unlocked_at).toLocaleDateString("nl-NL")}
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
          <h2 className="text-lg font-semibold">Clienten</h2>
          <p className="text-sm text-gray-600">
            Dit is de basis voor het therapeut-account. Koppeling van clienten en voortgang kunnen we hierna toevoegen.
          </p>
        </section>
      ) : null}
    </div>
  );
}
