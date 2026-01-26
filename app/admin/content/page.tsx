import Link from "next/link";
import { getContentItems } from "@/lib/content/queries";
import "../../styles/globals.css";
import "../../styles/content.css";

export default async function ContentIndexPage() {
  const items = await getContentItems();

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Content</h1>

        <Link
          href="/admin/content/new"
          className="px-4 py-2 bg-black text-white rounded"
        >
          Nieuw item
        </Link>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Titel</th>
            <th>Status</th>
            <th>Taal</th>
            <th>Datum</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-2">
                <Link
                  href={`/admin/content/${item.id}`}
                  className="underline"
                >
                  {item.title || "(geen titel)"}
                </Link>
              </td>
              <td>{item.status}</td>
              <td>{item.language}</td>
              <td>{new Date(item.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
