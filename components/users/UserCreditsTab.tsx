"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { grantCredits } from "@/lib/credits/grantCredits";
import type { CreditWallet, CreditTransaction } from "@/lib/credits/types";
import {
  deactivateTherapistDirectoryEntitlement,
  deactivateYearAssignmentsEntitlement,
} from "@/app/admin/users/actions";
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";
import {
  getTimedEntitlementSummary,
  isTimedEntitlementActive,
} from "@/lib/users/entitlements";

import CreditOverview from "@/components/users/CreditOverview";
import CreditTransactions from "@/components/users/CreditTransactions";

type Props = {
  userId: string;
  wallet: CreditWallet;
  transactions: CreditTransaction[];
  yearEntitlements: {
    id: string;
    entitlement_key: string;
    starts_at: string;
    ends_at: string | null;
    is_active: boolean;
    created_at: string;
  }[];
  therapistEntitlements: {
    id: string;
    entitlement_key: string;
    starts_at: string;
    ends_at: string | null;
    is_active: boolean;
    created_at: string;
  }[];
  isSelf: boolean;
  isSuperAdmin: boolean; // ⭐ TOEGEVOEGD
  language: UiLanguage;
};

export default function UserCreditsTab({
  userId,
  wallet,
  transactions,
  yearEntitlements,
  therapistEntitlements,
  isSelf,
  isSuperAdmin,
  language,
}: Props) {
  const t = getAppMessages(language).userCredits;
  const locale = language === "en" ? "en-US" : language === "de" ? "de-DE" : "nl-NL";
  const router = useRouter();
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [entitlementBusyId, setEntitlementBusyId] = useState<string | null>(null);
  const therapistSubscription = getTimedEntitlementSummary(therapistEntitlements);
  const therapistSubscriptionStatus =
    therapistSubscription.status === "active"
      ? t.active
      : therapistSubscription.status === "planned"
        ? t.planned
        : t.free;
  const therapistSubscriptionStart =
    therapistSubscription.current?.starts_at ??
    therapistSubscription.next?.starts_at ??
    null;
  const therapistSubscriptionActiveUntil =
    therapistSubscription.current?.ends_at
      ? new Date(therapistSubscription.current.ends_at).toLocaleDateString(locale)
      : therapistSubscription.current
        ? t.indefinite
        : "-";
  const therapistSubscriptionRenewedUntil = therapistSubscription.hasOpenEnded
    ? t.indefinite
    : therapistSubscription.latestRelevantEndAt
      ? new Date(therapistSubscription.latestRelevantEndAt).toLocaleDateString(locale)
      : t.notScheduled;

  // ✅ JUISTE UI-GUARD
  const disableActions = isSelf && !isSuperAdmin;

  async function apply(delta: number) {
    if (delta === 0) return;

    setLoading(true);
    try {
      await grantCredits({
        userId,
        amount: delta,
        reason: "admin_adjust",
      });

      setAmount(0);
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : t.adjustFailed;
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(
    entitlementId: string,
    kind: "year" | "therapist"
  ) {
    setEntitlementBusyId(entitlementId);
    try {
      if (kind === "therapist") {
        await deactivateTherapistDirectoryEntitlement({
          entitlementId,
          userId,
        });
      } else {
        await deactivateYearAssignmentsEntitlement({
          entitlementId,
          userId,
        });
      }
      router.refresh();
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : t.endFailed;
      alert(message);
    } finally {
      setEntitlementBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <CreditOverview wallet={wallet} language={language} />

      <section className="rounded border bg-white p-4 space-y-3">
        <h2 className="text-sm font-semibold">
          {t.adjustCredits}
        </h2>

        {isSelf && !isSuperAdmin && (
          <p className="text-xs text-red-600">
            {t.selfGuard}
          </p>
        )}

        <div className="flex items-center gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-24 rounded border px-2 py-1 text-sm"
          />

          <button
            onClick={() => apply(amount)}
            disabled={loading || disableActions || amount <= 0}
            className="rounded bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {t.add}
          </button>

          <button
            onClick={() => apply(-amount)}
            disabled={loading || disableActions || amount <= 0}
            className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {t.subtract}
          </button>
        </div>
      </section>

      <section className="rounded border bg-white p-4 space-y-3">
        <h2 className="text-sm font-semibold">
          {t.yearSubTitle}
        </h2>

        {yearEntitlements.length === 0 ? (
          <p className="text-sm text-gray-600">
            {t.noYearSub}
          </p>
        ) : (
          <div className="space-y-2">
            {yearEntitlements.map((item) => {
              const isActive = isTimedEntitlementActive(item);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                >
                  <div>
                    <div>
                      {t.start}: {new Date(item.starts_at).toLocaleDateString(locale)} • {t.endLabel}: {item.ends_at ? new Date(item.ends_at).toLocaleDateString(locale) : t.indefinite}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t.status}: {isActive ? t.active : t.ended}
                    </div>
                  </div>

                  {isActive ? (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(item.id, "year")}
                      disabled={entitlementBusyId === item.id}
                      className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 disabled:opacity-50"
                    >
                      {entitlementBusyId === item.id ? t.ending : t.endAction}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded border bg-white p-4 space-y-3">
        <h2 className="text-sm font-semibold">
          {t.therapistSubTitle}
        </h2>

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded border bg-stone-50 px-3 py-2 text-sm">
            <div className="text-xs uppercase tracking-[0.16em] text-stone-500">
              {t.status}
            </div>
            <div className="mt-1 font-medium text-stone-900">
              {therapistSubscriptionStatus}
            </div>
            {therapistSubscriptionStart ? (
              <div className="mt-1 text-xs text-stone-500">
                {t.start}: {new Date(therapistSubscriptionStart).toLocaleDateString(locale)}
              </div>
            ) : null}
          </div>

          <div className="rounded border bg-stone-50 px-3 py-2 text-sm">
            <div className="text-xs uppercase tracking-[0.16em] text-stone-500">
              {t.activeUntil}
            </div>
            <div className="mt-1 font-medium text-stone-900">
              {therapistSubscriptionActiveUntil}
            </div>
          </div>

          <div className="rounded border bg-stone-50 px-3 py-2 text-sm">
            <div className="text-xs uppercase tracking-[0.16em] text-stone-500">
              {t.renewedUntil}
            </div>
            <div className="mt-1 font-medium text-stone-900">
              {therapistSubscriptionRenewedUntil}
            </div>
          </div>
        </div>

        {therapistEntitlements.length === 0 ? (
          <p className="text-sm text-gray-600">
            {t.noTherapistSub}
          </p>
        ) : (
          <div className="space-y-2">
            {therapistEntitlements.map((item) => {
              const isActive = isTimedEntitlementActive(item);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                >
                  <div>
                    <div>
                      {t.start}: {new Date(item.starts_at).toLocaleDateString(locale)} • {t.endLabel}: {item.ends_at ? new Date(item.ends_at).toLocaleDateString(locale) : t.indefinite}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t.status}: {isActive ? t.active : t.ended}
                    </div>
                  </div>

                  {isActive ? (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(item.id, "therapist")}
                      disabled={entitlementBusyId === item.id}
                      className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 disabled:opacity-50"
                    >
                      {entitlementBusyId === item.id ? t.ending : t.endAction}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <CreditTransactions transactions={transactions} language={language} />
    </div>
  );
}
