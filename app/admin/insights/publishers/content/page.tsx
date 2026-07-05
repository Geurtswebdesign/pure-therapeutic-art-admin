import Link from "next/link";
import {
  resolveRange,
  getRecentContentViewers,
  getViewedContent,
} from "@/lib/insights/queries";
import RangeTabs from "@/components/analytics/RangeTabs";

type SearchParams = {
  range?: string | string[];
};

export default async function ViewedContentPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rangeValue = Array.isArray(params?.range) ? params?.range[0] : params?.range;
  const range = resolveRange(rangeValue);
  const [viewedContent, recentViewers] = await Promise.all([
    getViewedContent(range, 50),
    getRecentContentViewers(range, 100),
  ]);

  return (
    <section className="space-y-6">
      <RangeTabs basePath="/admin/insights/publishers/content" value={rangeValue} />

      <div className="rounded border bg-white p-4">
        <h2 className="text-sm font-semibold">Viewed content</h2>
        <p className="mt-1 text-xs text-gray-500">
          Content items opened by users in the selected period.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500">
              <tr className="border-b">
                <th className="py-2 text-left font-medium">Content</th>
                <th className="py-2 text-left font-medium">Path</th>
                <th className="py-2 text-right font-medium">Views</th>
                <th className="py-2 text-right font-medium">Visitors</th>
                <th className="py-2 text-right font-medium">Sessions</th>
                <th className="py-2 text-right font-medium">Last viewed</th>
              </tr>
            </thead>
            <tbody>
              {viewedContent.length ? (
                viewedContent.map((row) => (
                  <tr key={row.content_id} className="border-b last:border-b-0">
                    <td className="py-2 text-gray-800">
                      <div className="font-medium">
                        {row.title ?? row.content_id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.language ? row.language.toUpperCase() : "unknown"}
                      </div>
                    </td>
                    <td className="py-2 text-gray-600">
                      {row.sample_path ? (
                        <Link className="text-blue-600 hover:underline" href={row.sample_path}>
                          {row.sample_path}
                        </Link>
                      ) : (
                        <span className="text-gray-400">No path</span>
                      )}
                    </td>
                    <td className="py-2 text-right text-gray-700">{row.views}</td>
                    <td className="py-2 text-right text-gray-700">
                      {row.unique_visitors}
                    </td>
                    <td className="py-2 text-right text-gray-700">
                      {row.sessions}
                    </td>
                    <td className="py-2 text-right text-gray-700">
                      {row.last_viewed_at
                        ? new Date(row.last_viewed_at).toLocaleString("nl-NL")
                        : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-xs text-gray-400" colSpan={6}>
                    No viewed content events yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="text-sm font-semibold">Recent viewers</h2>
        <p className="mt-1 text-xs text-gray-500">
          Logged-in users with stored content progress. Anonymous visitors are not identified.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500">
              <tr className="border-b">
                <th className="py-2 text-left font-medium">User</th>
                <th className="py-2 text-left font-medium">Content</th>
                <th className="py-2 text-left font-medium">Path</th>
                <th className="py-2 text-right font-medium">Last viewed</th>
              </tr>
            </thead>
            <tbody>
              {recentViewers.length ? (
                recentViewers.map((row) => (
                  <tr
                    key={`${row.user_id}:${row.content_id}:${row.last_viewed_at}`}
                    className="border-b last:border-b-0"
                  >
                    <td className="py-2 text-gray-800">
                      <div className="font-medium">{row.user_name}</div>
                      <div className="text-xs text-gray-500">
                        {row.user_id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="py-2 text-gray-800">
                      <div className="font-medium">{row.content_title}</div>
                      <div className="text-xs text-gray-500">
                        {row.content_language
                          ? row.content_language.toUpperCase()
                          : "unknown"}
                      </div>
                    </td>
                    <td className="py-2 text-gray-600">
                      {row.content_path ? (
                        <Link className="text-blue-600 hover:underline" href={row.content_path}>
                          {row.content_path}
                        </Link>
                      ) : (
                        <span className="text-gray-400">No path</span>
                      )}
                    </td>
                    <td className="py-2 text-right text-gray-700">
                      {row.last_viewed_at
                        ? new Date(row.last_viewed_at).toLocaleString("nl-NL")
                        : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-4 text-xs text-gray-400" colSpan={4}>
                    No logged-in viewer history yet.
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
