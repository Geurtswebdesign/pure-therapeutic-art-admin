import { resolveRange, getPerfMetrics } from "@/lib/insights/queries";
import RangeTabs from "@/components/analytics/RangeTabs";

type SearchParams = {
  range?: string | string[];
};

export default async function SiteSpeedPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rangeValue = Array.isArray(params?.range) ? params?.range[0] : params?.range;
  const range = resolveRange(rangeValue);
  const metrics = await getPerfMetrics(range);

  return (
    <section className="space-y-6">
      <RangeTabs basePath="/admin/insights/site-speed" value={rangeValue} />

      <div className="rounded border bg-white p-4">
        <h2 className="text-sm font-semibold">Performance metrics</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500">
              <tr className="border-b">
                <th className="py-2 text-left font-medium">Metric</th>
                <th className="py-2 text-right font-medium">Avg</th>
                <th className="py-2 text-right font-medium">P95</th>
              </tr>
            </thead>
            <tbody>
              {metrics.length ? (
                metrics.map((row) => (
                  <tr key={row.metric} className="border-b last:border-b-0">
                    <td className="py-2 text-gray-800">{row.metric}</td>
                    <td className="py-2 text-right text-gray-700">
                      {Number(row.avg_value ?? 0).toFixed(2)}
                    </td>
                    <td className="py-2 text-right text-gray-700">
                      {Number(row.p95_value ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-xs text-gray-400" colSpan={3}>
                    <div className="space-y-2">
                      <p>No data yet.</p>
                      <p>
                        Tip: Web Vitals events are sent by the client. Load a
                        public page (outside /admin) a few times to capture LCP,
                        CLS, and INP.
                      </p>
                    </div>
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
