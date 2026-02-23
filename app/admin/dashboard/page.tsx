import Link from "next/link";
import "@/styles/globals.css";
import "@/styles/content.css";

export default function AdminDashboardPage() {
  return (
    <div className="p-6 w-full">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Centrale ingang voor operations, content en platformbeheer.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Link className="rounded border bg-white p-4 hover:bg-gray-50" href="/admin/users">
          <h2 className="font-semibold">Gebruikers</h2>
          <p className="mt-1 text-sm text-gray-600">Identiteit, rollen en accountbeheer.</p>
        </Link>
        <Link className="rounded border bg-white p-4 hover:bg-gray-50" href="/admin/administration">
          <h2 className="font-semibold">Administratie</h2>
          <p className="mt-1 text-sm text-gray-600">Credits, wallets en transacties.</p>
        </Link>
        <Link className="rounded border bg-white p-4 hover:bg-gray-50" href="/admin/content">
          <h2 className="font-semibold">Content</h2>
          <p className="mt-1 text-sm text-gray-600">Content-items, taxonomieen en media.</p>
        </Link>
      </div>
    </div>
  );
}
