import { resolveRange, getDeviceBreakdown, getOsBreakdown, getBrowserBreakdown } from "@/lib/insights/queries";
import RangeTabs from "@/components/analytics/RangeTabs";

type SearchParams = {
  range?: string | string[];
};

export default async function TrafficTechnologyPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rangeValue = Array.isArray(params?.range) ? params?.range[0] : params?.range;
  const range = resolveRange(rangeValue);

  const [devices, osList, browsers] = await Promise.all([
    getDeviceBreakdown(range),
    getOsBreakdown(range),
    getBrowserBreakdown(range),
  ]);

  return (
    <section className="space-y-6">
      <RangeTabs basePath="/admin/insights/traffic/technology" value={rangeValue} />

      <div className="grid gap-6 lg:grid-cols-3">
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
          <h3 className="text-sm font-semibold">Operating systems</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            {osList.length ? (
              osList.map((item) => (
                <li key={item.os} className="flex items-center justify-between">
                  <span>{item.os}</span>
                  <span className="text-xs text-gray-500">{item.pageviews}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-gray-400">No data yet.</li>
            )}
          </ul>
        </article>

        <article className="rounded border bg-white p-4">
          <h3 className="text-sm font-semibold">Browsers</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            {browsers.length ? (
              browsers.map((item) => (
                <li key={item.browser} className="flex items-center justify-between">
                  <span>{item.browser}</span>
                  <span className="text-xs text-gray-500">{item.pageviews}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-gray-400">No data yet.</li>
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}
