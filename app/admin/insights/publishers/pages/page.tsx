import { resolveRange, getTopPages } from "@/lib/insights/queries";
import RangeTabs from "@/components/analytics/RangeTabs";

type SearchParams = {
  range?: string | string[];
};

export default async function PageReportPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rangeValue = Array.isArray(params?.range) ? params?.range[0] : params?.range;
  const range = resolveRange(rangeValue);
  const pages = await getTopPages(range, 20);

  return (
    <section className="space-y-6">
      <RangeTabs basePath="/admin/insights/publishers/pages" value={rangeValue} />

      <div className="rounded border bg-white p-4">
        <h2 className="text-sm font-semibold">Top pages</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500">
              <tr className="border-b">
                <th className="py-2 text-left font-medium">Page</th>
                <th className="py-2 text-right font-medium">Pageviews</th>
                <th className="py-2 text-right font-medium">Unique visitors</th>
              </tr>
            </thead>
            <tbody>
              {pages.length ? (
                pages.map((row) => (
                  <tr key={row.path} className="border-b last:border-b-0">
                    <td className="py-2 text-gray-800">{row.path}</td>
                    <td className="py-2 text-right text-gray-700">
                      {row.pageviews}
                    </td>
                    <td className="py-2 text-right text-gray-700">
                      {row.unique_visitors}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-xs text-gray-400" colSpan={3}>
                    No data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
