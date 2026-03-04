import {
  resolveRange,
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

type SearchParams = {
  range?: string | string[];
};

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

export default async function EcommercePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rangeValue = Array.isArray(params?.range) ? params?.range[0] : params?.range;
  const range = resolveRange(rangeValue);

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
  const primaryRevenue = revenueEntries[0];
  const revenueLabel = primaryRevenue
    ? formatCurrency(primaryRevenue.amountCents, primaryRevenue.currency)
    : "0";
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
      <RangeTabs basePath="/admin/insights/ecommerce" value={rangeValue} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded border bg-white p-4">
          <p className="text-xs text-gray-500">Revenue</p>
          <h2 className="text-2xl font-semibold">{revenueLabel}</h2>
          {revenueEntries.length > 1 ? (
            <p className="mt-2 text-xs text-gray-500">
              Mixed currencies:{" "}
              {revenueEntries
                .map((row) => formatCurrency(row.amountCents, row.currency))
                .join(" · ")}
            </p>
          ) : null}
        </article>
        <article className="rounded border bg-white p-4">
          <p className="text-xs text-gray-500">Transactions</p>
          <h2 className="text-2xl font-semibold">{overview.transactions}</h2>
        </article>
        <article className="rounded border bg-white p-4">
          <p className="text-xs text-gray-500">Avg. order value</p>
          <h2 className="text-2xl font-semibold">{avgOrderValue}</h2>
        </article>
        <article className="rounded border bg-white p-4">
          <p className="text-xs text-gray-500">Conversion rate</p>
          <h2 className="text-2xl font-semibold">{conversionRate}</h2>
          <p className="mt-2 text-xs text-gray-500">
            Based on sessions in Traffic overview.
          </p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <article className="rounded border bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Revenue trend</h3>
            <span className="text-xs text-gray-500">{rangeValue ?? "30d"}</span>
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
