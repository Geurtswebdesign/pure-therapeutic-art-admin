import { resolveRange, getTrafficOverview, getTopPages } from "@/lib/insights/queries";
import RangeTabs from "@/components/analytics/RangeTabs";

type SearchParams = {
  range?: string | string[];
};

export default async function PublishersOverviewPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rangeValue = Array.isArray(params?.range) ? params?.range[0] : params?.range;
  const range = resolveRange(rangeValue);

  const [overview, pages] = await Promise.all([
    getTrafficOverview(range),
    getTopPages(range, 8),
  ]);

  return (
    <section className="space-y-6">
      <RangeTabs basePath="/admin/insights/publishers/overview" value={rangeValue} />

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

      <div className="rounded border bg-white p-4">
        <h3 className="text-sm font-semibold">Top pages</h3>
        <div className="mt-4 space-y-2 text-sm text-gray-600">
          {pages.length ? (
            pages.map((row) => (
              <div key={row.path} className="flex items-center justify-between">
                <span className="truncate">{row.path}</span>
                <span className="text-xs text-gray-500">{row.pageviews}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400">No data yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
