import { resolveRange, getTopEvents, getTopEventsByCategoryPrefix } from "@/lib/insights/queries";
import RangeTabs from "@/components/analytics/RangeTabs";
import BarList from "@/components/analytics/BarList";

type SearchParams = {
  range?: string | string[];
};

export default async function PublishersEventsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rangeValue = Array.isArray(params?.range) ? params?.range[0] : params?.range;
  const range = resolveRange(rangeValue);
  const [events, adminEvents] = await Promise.all([
    getTopEvents(range, 25),
    getTopEventsByCategoryPrefix(range, "admin_", 12),
  ]);

  const adminData = adminEvents.map((row) => ({
    label: `${row.event_name} (${row.event_category})`,
    value: Number(row.total ?? 0),
  }));

  return (
    <section className="space-y-6">
      <RangeTabs basePath="/admin/insights/publishers/events" value={rangeValue} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
        <div className="rounded border bg-white p-4">
          <h2 className="text-sm font-semibold">Admin activity</h2>
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
        </div>

        <div className="rounded border bg-white p-4">
          <h2 className="text-sm font-semibold">Events</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500">
                <tr className="border-b">
                  <th className="py-2 text-left font-medium">Event</th>
                  <th className="py-2 text-left font-medium">Category</th>
                  <th className="py-2 text-right font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {events.length ? (
                  events.map((row) => (
                    <tr key={`${row.event_category}:${row.event_name}`} className="border-b last:border-b-0">
                      <td className="py-2 text-gray-800">{row.event_name}</td>
                      <td className="py-2 text-gray-600">{row.event_category}</td>
                      <td className="py-2 text-right text-gray-700">{row.total}</td>
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
      </div>
    </section>
  );
}
