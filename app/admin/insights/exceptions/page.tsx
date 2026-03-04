import { resolveRange, getRecentExceptions } from "@/lib/insights/queries";
import RangeTabs from "@/components/analytics/RangeTabs";

type SearchParams = {
  range?: string | string[];
};

export default async function ExceptionsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rangeValue = Array.isArray(params?.range) ? params?.range[0] : params?.range;
  const range = resolveRange(rangeValue);
  const exceptions = await getRecentExceptions(range, 20);

  return (
    <section className="space-y-6">
      <RangeTabs basePath="/admin/insights/exceptions" value={rangeValue} />

      <div className="rounded border bg-white p-4">
        <h2 className="text-sm font-semibold">Exceptions</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500">
              <tr className="border-b">
                <th className="py-2 text-left font-medium">Message</th>
                <th className="py-2 text-right font-medium">Count</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.length ? (
                exceptions.map((row) => (
                  <tr key={row.event_label} className="border-b last:border-b-0">
                    <td className="py-2 text-gray-800">{row.event_label}</td>
                    <td className="py-2 text-right text-gray-700">{row.total}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-xs text-gray-400" colSpan={2}>
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
