import { resolveRange, getTrafficOverview, getTopReferrers, getTopSources, getDeviceBreakdown, getDailyPageviews, getTopEventsByCategoryPrefix } from "@/lib/insights/queries";
import LineChart from "@/components/analytics/LineChart";
import DonutChart from "@/components/analytics/DonutChart";
import RangeTabs from "@/components/analytics/RangeTabs";
import BarList from "@/components/analytics/BarList";

type SearchParams = {
  range?: string | string[];
};

export default async function TrafficOverviewPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rangeValue = Array.isArray(params?.range) ? params?.range[0] : params?.range;
  const range = resolveRange(rangeValue);

  const [overview, referrers, sources, devices, daily, adminEvents] = await Promise.all([
    getTrafficOverview(range),
    getTopReferrers(range, 8),
    getTopSources(range, 8),
    getDeviceBreakdown(range),
    getDailyPageviews(range),
    getTopEventsByCategoryPrefix(range, "admin_", 6),
  ]);

  const lineData = daily.map((row) => ({
    label: row.day,
    value: Number(row.pageviews ?? 0),
  }));

  const deviceColors = ["#2563eb", "#60a5fa", "#93c5fd", "#bfdbfe"];
  const donutData = devices.map((item, index) => ({
    label: item.device,
    value: Number(item.pageviews ?? 0),
    color: deviceColors[index % deviceColors.length],
  }));

  const adminData = adminEvents.map((row) => ({
    label: row.event_name,
    value: Number(row.total ?? 0),
  }));

  return (
    <section className="space-y-6">
      <RangeTabs basePath="/admin/insights/traffic/overview" value={rangeValue} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <article className="rounded border bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Pageviews</h3>
            <span className="text-xs text-gray-500">
              {rangeValue ?? "30d"}
            </span>
          </div>
          <div className="mt-4">
            <LineChart data={lineData} />
          </div>
        </article>

        <article className="rounded border bg-white p-4">
          <h3 className="text-sm font-semibold">Device breakdown</h3>
          <div className="mt-4 flex items-center gap-4">
            <DonutChart data={donutData} />
            <ul className="space-y-2 text-xs text-gray-600">
              {donutData.length ? (
                donutData.map((item) => (
                  <li key={item.label} className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: item.color }}
                    />
                    <span className="capitalize">{item.label}</span>
                    <span className="ml-auto text-gray-500">{item.value}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-gray-400">No data yet.</li>
              )}
            </ul>
          </div>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded border bg-white p-4">
          <p className="text-xs text-gray-500">Pageviews</p>
          <h2 className="text-2xl font-semibold">{overview.pageviews}</h2>
        </article>
        <article className="rounded border bg-white p-4">
          <p className="text-xs text-gray-500">Unique visitors</p>
          <h2 className="text-2xl font-semibold">{overview.uniqueVisitors}</h2>
        </article>
        <article className="rounded border bg-white p-4">
          <p className="text-xs text-gray-500">Sessions</p>
          <h2 className="text-2xl font-semibold">{overview.sessions}</h2>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
        <article className="rounded border bg-white p-4">
          <h3 className="text-sm font-semibold">Top referrers</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            {referrers.length ? (
              referrers.map((item) => (
                <li key={item.referrer} className="flex items-center justify-between">
                  <span className="truncate">{item.referrer}</span>
                  <span className="text-xs text-gray-500">{item.pageviews}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-gray-400">No data yet.</li>
            )}
          </ul>
        </article>

        <article className="rounded border bg-white p-4">
          <h3 className="text-sm font-semibold">Source / medium</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            {sources.length ? (
              sources.map((item) => (
                <li key={item.source} className="flex items-center justify-between">
                  <span className="truncate">{item.source}</span>
                  <span className="text-xs text-gray-500">{item.pageviews}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-gray-400">No data yet.</li>
            )}
          </ul>
        </article>

        <article className="rounded border bg-white p-4">
          <h3 className="text-sm font-semibold">Devices</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            {devices.length ? (
              devices.map((item) => (
                <li key={item.device} className="flex items-center justify-between">
                  <span className="capitalize">{item.device}</span>
                  <span className="text-xs text-gray-500">{item.pageviews}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-gray-400">No data yet.</li>
            )}
          </ul>
        </article>

        <article className="rounded border bg-white p-4">
          <h3 className="text-sm font-semibold">Admin activity</h3>
          <p className="mt-1 text-xs text-gray-500">
            Most common admin actions in this period.
          </p>
          <div className="mt-4">
            {adminData.length ? (
              <BarList data={adminData} />
            ) : (
              <p className="text-xs text-gray-400">No admin events yet.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
