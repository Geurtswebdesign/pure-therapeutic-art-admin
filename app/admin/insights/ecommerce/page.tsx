import {
  resolveRange,
  resolveMonthRange,
  getEcommerceOverview,
  getEcommerceDailyRevenue,
  getTopCreditPacks,
  getTopCoupons,
  getCartAbandonment,
  getEcommerceFunnel,
  getTrafficOverview,
} from "@/lib/insights/queries";
import RangeTabs from "@/components/analytics/RangeTabs";
import LineChart from "@/components/analytics/LineChart";
import BarList from "@/components/analytics/BarList";
import MonthFilter from "@/components/analytics/MonthFilter";

type SearchParams = {
  range?: string | string[];
  month?: string | string[];
};

const DANNY_SHARE = 0.22;
const STORE_SHARE = 0.15;
const VAT_SHARE = 0.09;

function formatCurrency(amountCents: number, currency: string) {
  try {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${currency}`;
  }
}

function calculateRevenueSplit(input: {
  grossAmountCents: number;
  dannyEligibleAmountCents: number;
  appleGrossAmountCents: number;
  googleGrossAmountCents: number;
}) {
  const {
    grossAmountCents,
    dannyEligibleAmountCents,
    appleGrossAmountCents,
    googleGrossAmountCents,
  } = input;

  const dannyAmountCents = Math.round(dannyEligibleAmountCents * DANNY_SHARE);
  const appleAmountCents = Math.round(appleGrossAmountCents * STORE_SHARE);
  const googleAmountCents = Math.round(googleGrossAmountCents * STORE_SHARE);
  const storeAmountCents = appleAmountCents + googleAmountCents;
  const vatAmountCents = Math.round(grossAmountCents * VAT_SHARE);
  const remainingAmountCents =
    grossAmountCents - dannyAmountCents - storeAmountCents - vatAmountCents;

  return {
    grossAmountCents,
    dannyEligibleAmountCents,
    appleGrossAmountCents,
    googleGrossAmountCents,
    dannyAmountCents,
    appleAmountCents,
    googleAmountCents,
    storeAmountCents,
    vatAmountCents,
    remainingAmountCents,
  };
}

function getEmptyStoreRevenue() {
  return {
    appleAmountCents: 0,
    googleAmountCents: 0,
    otherAmountCents: 0,
  };
}

function getStoreBreakdownByCurrency(
  storeRevenueEntries: Array<{
    currency: string;
    appleAmountCents: number;
    googleAmountCents: number;
    otherAmountCents: number;
  }>
) {
  return new Map(storeRevenueEntries.map((entry) => [entry.currency, entry]));
}

function calculateStoreRevenueEntries(
  storeRevenueEntries: Array<{
    currency: string;
    appleAmountCents: number;
    googleAmountCents: number;
    otherAmountCents: number;
  }>
) {
  return storeRevenueEntries
    .map((entry) => ({
      currency: entry.currency,
      amountCents: entry.appleAmountCents + entry.googleAmountCents,
    }))
    .filter((entry) => entry.amountCents > 0);
}

function calculateRevenueBreakdown(
  revenueEntries: Array<{ currency: string; amountCents: number }>,
  storeRevenueEntries: Array<{
    currency: string;
    appleAmountCents: number;
    googleAmountCents: number;
    otherAmountCents: number;
  }>
) {
  const storeBreakdownByCurrency = getStoreBreakdownByCurrency(storeRevenueEntries);

  return revenueEntries.map((entry) => {
    const storeBreakdown = storeBreakdownByCurrency.get(entry.currency) ?? getEmptyStoreRevenue();
    const dannyEligibleAmountCents = entry.amountCents;

    return {
      currency: entry.currency,
      ...calculateRevenueSplit({
        grossAmountCents: entry.amountCents,
        dannyEligibleAmountCents,
        appleGrossAmountCents: storeBreakdown.appleAmountCents,
        googleGrossAmountCents: storeBreakdown.googleAmountCents,
      }),
    };
  });
}

export default async function EcommercePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rangeValue = Array.isArray(params?.range) ? params?.range[0] : params?.range;
  const monthValue = Array.isArray(params?.month) ? params?.month[0] : params?.month;
  const monthRange = resolveMonthRange(monthValue);
  const range = monthRange ?? resolveRange(rangeValue);
  const periodLabel = monthRange
    ? new Intl.DateTimeFormat("nl-NL", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(range.from)
    : rangeValue ?? "30d";
  const monthOptions = Array.from({ length: 12 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCMonth(date.getUTCMonth() - index);

    return {
      value: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("nl-NL", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date),
    };
  });

  const [
    overview,
    revenueDaily,
    topPacks,
    coupons,
    abandoned,
    funnel,
    traffic,
  ] = await Promise.all([
    getEcommerceOverview(range),
    getEcommerceDailyRevenue(range),
    getTopCreditPacks(range, 6),
    getTopCoupons(range, 8),
    getCartAbandonment(range, 8),
    getEcommerceFunnel(range),
    getTrafficOverview(range),
  ]);

  const revenueEntries = overview.revenueEntries.sort(
    (a, b) => b.amountCents - a.amountCents
  );
  const revenueBreakdown = calculateRevenueBreakdown(
    revenueEntries,
    overview.storeRevenueEntries
  );
  const storeRevenueEntries = calculateStoreRevenueEntries(
    overview.storeRevenueEntries
  ).sort((a, b) => b.amountCents - a.amountCents);
  const primaryStoreRevenue = storeRevenueEntries[0];
  const primaryRevenue = revenueEntries[0];
  const storeRevenueLabel = primaryStoreRevenue
    ? formatCurrency(primaryStoreRevenue.amountCents, primaryStoreRevenue.currency)
    : "0";
  const revenueLabel = primaryRevenue
    ? formatCurrency(primaryRevenue.amountCents, primaryRevenue.currency)
    : "0";
  const otherRevenueLabel =
    primaryRevenue && primaryStoreRevenue && primaryRevenue.currency === primaryStoreRevenue.currency
      ? formatCurrency(
          primaryRevenue.amountCents - primaryStoreRevenue.amountCents,
          primaryRevenue.currency
        )
      : null;
  const avgOrderValue =
    overview.transactions > 0 && revenueEntries.length === 1
      ? formatCurrency(primaryRevenue.amountCents / overview.transactions, primaryRevenue.currency)
      : "-";
  const conversionRate =
    traffic.sessions > 0
      ? `${((overview.transactions / traffic.sessions) * 100).toFixed(2)}%`
      : "-";

  const revenueSeries = revenueDaily.map((row) => ({
    label: row.day,
    value: Number(row.amountCents ?? 0) / 100,
  }));

  const packData = topPacks.map((row) => ({
    label: row.label,
    value: row.revenue / 100,
  }));
  const couponData = coupons.map((row) => ({
    label: row.code,
    value: Number(row.total ?? 0),
  }));
  const abandonData = abandoned.map((row) => ({
    label: row.item,
    value: Number(row.total ?? 0),
  }));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <RangeTabs basePath="/admin/insights/ecommerce" value={rangeValue} />
        <MonthFilter
          basePath="/admin/insights/ecommerce"
          month={monthRange ? monthValue : undefined}
          range={rangeValue}
          options={monthOptions}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded border bg-white p-4">
          <p className="text-xs text-gray-500">RevenueCat / store revenue</p>
          <h2 className="text-2xl font-semibold">{storeRevenueLabel}</h2>
          {storeRevenueEntries.length > 1 ? (
            <p className="mt-2 text-xs text-gray-500">
              Mixed currencies:{" "}
              {storeRevenueEntries
                .map((row) => formatCurrency(row.amountCents, row.currency))
                .join(" · ")}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-gray-500">
            Apple + Google bruto omzet.
          </p>
        </article>
        <article className="rounded border bg-white p-4">
          <p className="text-xs text-gray-500">Total production revenue</p>
          <h2 className="text-2xl font-semibold">{revenueLabel}</h2>
          {otherRevenueLabel && primaryRevenue?.amountCents !== primaryStoreRevenue?.amountCents ? (
            <p className="mt-2 text-xs text-gray-500">
              Other channels: {otherRevenueLabel}
            </p>
          ) : null}
        </article>
        <article className="rounded border bg-white p-4">
          <p className="text-xs text-gray-500">Avg. order value</p>
          <h2 className="text-2xl font-semibold">{avgOrderValue}</h2>
          <p className="mt-2 text-xs text-gray-500">
            Based on {overview.transactions} transactions.
          </p>
        </article>
        <article className="rounded border bg-white p-4">
          <p className="text-xs text-gray-500">Conversion rate</p>
          <h2 className="text-2xl font-semibold">{conversionRate}</h2>
          <p className="mt-2 text-xs text-gray-500">
            Based on sessions in Traffic overview.
          </p>
        </article>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Afdrachten op omzet</h3>
          </div>
          <span className="text-xs capitalize text-gray-500">{periodLabel}</span>
        </div>

        {revenueBreakdown.length ? (
          <div className="grid gap-4">
            {revenueBreakdown.map((entry) => (
              <article
                key={entry.currency}
                className="rounded border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      {entry.currency}
                    </p>
                    <h4 className="mt-1 text-lg font-semibold text-stone-900">
                      {formatCurrency(entry.grossAmountCents, entry.currency)}
                    </h4>
                    <p className="mt-1 text-xs text-gray-500">Bruto omzet</p>
                  </div>
                  <div className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                    Netto over: {formatCurrency(entry.remainingAmountCents, entry.currency)}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-3">
                    <p className="text-xs font-medium text-rose-700">
                      Danny (22% op credits/microtransacties)
                    </p>
                    <p className="mt-1 text-base font-semibold text-rose-900">
                      {formatCurrency(entry.dannyAmountCents, entry.currency)}
                    </p>
                    <p className="mt-1 text-xs text-rose-700/80">
                      Basis: {formatCurrency(entry.dannyEligibleAmountCents, entry.currency)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-3">
                    <p className="text-xs font-medium text-amber-700">Apple (15%)</p>
                    <p className="mt-1 text-base font-semibold text-amber-900">
                      {formatCurrency(entry.appleAmountCents, entry.currency)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-3">
                    <p className="text-xs font-medium text-orange-700">Google (15%)</p>
                    <p className="mt-1 text-base font-semibold text-orange-900">
                      {formatCurrency(entry.googleAmountCents, entry.currency)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-3">
                    <p className="text-xs font-medium text-sky-700">BTW (9%)</p>
                    <p className="mt-1 text-base font-semibold text-sky-900">
                      {formatCurrency(entry.vatAmountCents, entry.currency)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3">
                    <p className="text-xs font-medium text-emerald-700">Resterend</p>
                    <p className="mt-1 text-base font-semibold text-emerald-900">
                      {formatCurrency(entry.remainingAmountCents, entry.currency)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <article className="rounded border bg-white p-4">
            <p className="text-xs text-gray-400">
              Nog geen omzet beschikbaar om de afdracht te berekenen.
            </p>
          </article>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <article className="rounded border bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Revenue trend</h3>
            <span className="text-xs capitalize text-gray-500">{periodLabel}</span>
          </div>
          <div className="mt-4">
            {revenueSeries.length ? (
              <LineChart data={revenueSeries} height={220} />
            ) : (
              <p className="text-xs text-gray-400">No revenue data yet.</p>
            )}
          </div>
        </article>

        <article className="rounded border bg-white p-4">
          <h3 className="text-sm font-semibold">Top credit packs</h3>
          <div className="mt-4">
            {packData.length ? (
              <BarList data={packData} />
            ) : (
              <p className="text-xs text-gray-400">No purchases yet.</p>
            )}
          </div>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded border bg-white p-4">
          <h3 className="text-sm font-semibold">Coupons</h3>
          <p className="mt-1 text-xs text-gray-500">
            Events: `coupon_applied`
          </p>
          <div className="mt-4">
            {couponData.length ? (
              <BarList data={couponData} />
            ) : (
              <p className="text-xs text-gray-400">No coupon events yet.</p>
            )}
          </div>
        </article>

        <article className="rounded border bg-white p-4">
          <h3 className="text-sm font-semibold">Cart abandonment</h3>
          <p className="mt-1 text-xs text-gray-500">
            Events: `cart_abandoned`, `checkout_abandoned`
          </p>
          <div className="mt-4">
            {abandonData.length ? (
              <BarList data={abandonData} />
            ) : (
              <p className="text-xs text-gray-400">No abandonment events yet.</p>
            )}
          </div>
        </article>

        <article className="rounded border bg-white p-4">
          <h3 className="text-sm font-semibold">Funnel</h3>
          <p className="mt-1 text-xs text-gray-500">
            Events: `checkout_started`, `payment_submitted`, `purchase_completed`
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500">
                <tr className="border-b">
                  <th className="py-2 text-left font-medium">Step</th>
                  <th className="py-2 text-right font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {funnel.length ? (
                  funnel.map((row) => (
                    <tr key={row.step} className="border-b last:border-b-0">
                      <td className="py-2 text-gray-800">{row.step}</td>
                      <td className="py-2 text-right text-gray-700">
                        {row.total}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-4 text-xs text-gray-400" colSpan={2}>
                      No funnel events yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
