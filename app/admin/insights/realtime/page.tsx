import { getRealtime } from "@/lib/insights/queries";
import LineChart from "@/components/analytics/LineChart";

export default async function RealtimePage() {
  const rows = await getRealtime(30);
  const data = rows.map((row) => ({
    label: row.minute,
    value: Number(row.pageviews ?? 0),
  }));

  return (
    <section className="rounded border bg-white p-4">
      <h2 className="text-sm font-semibold">Realtime (last 30 minutes)</h2>
      <div className="mt-4">
        {data.length ? (
          <LineChart data={data} height={180} />
        ) : (
          <div className="space-y-2 text-xs text-gray-500">
            <p>No data yet.</p>
            <p>
              Tip: realtime is filled by pageview tracking. Visit a public page
              and refresh to generate data.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
