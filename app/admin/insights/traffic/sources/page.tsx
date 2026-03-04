import { resolveRange, getTopSources } from "@/lib/insights/queries";
import BarList from "@/components/analytics/BarList";
import RangeTabs from "@/components/analytics/RangeTabs";

type SearchParams = {
  range?: string | string[];
};

export default async function TrafficSourcesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rangeValue = Array.isArray(params?.range) ? params?.range[0] : params?.range;
  const range = resolveRange(rangeValue);
  const sources = await getTopSources(range, 20);

  return (
    <section className="space-y-6">
      <RangeTabs basePath="/admin/insights/traffic/sources" value={rangeValue} />

      <div className="rounded border bg-white p-4">
        <h2 className="text-sm font-semibold">Source / medium</h2>
        <div className="mt-4">
          {sources.length ? (
            <BarList
              data={sources.map((item) => ({
                label: item.source,
                value: Number(item.pageviews ?? 0),
              }))}
            />
          ) : (
            <p className="text-xs text-gray-400">No data yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
