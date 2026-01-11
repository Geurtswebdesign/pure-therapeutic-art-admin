import { notFound } from "next/navigation";
import Link from "next/link";
import { getUserDetail } from "./queries";

import UserHeader from "../_components/users/UserHeader";
import CreditsSummery from "../_components/users/CreditSummary";
import CreditActions from "../_components/users/CreditActions";
import CreditsHistoryTable from "../_components/users/CreditHistoryTable";

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ user_id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { user_id } = await params;
  const page = Number((await searchParams).page ?? "1");

  if (!user_id || page < 1) notFound();

  const data = await getUserDetail(user_id, page);
  if (!data || !data.profile) notFound();

  const { profile, wallet, transactions, pagination } = data;

  return (
    <div className="p-6 space-y-6">

      {/* Breadcrumbs + back */}
      <div className="space-y-2">
        <nav className="text-sm text-gray-500 flex items-center gap-2">
          <Link href="/admin" className="hover:underline">Admin</Link>
          <span>›</span>
          <Link href="/admin/users" className="hover:underline">Users</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">
            {profile.display_name ?? profile.email ?? "Gebruiker"}
          </span>
        </nav>

        <Link
          href="/admin/users"
          className="inline-block text-sm text-blue-600 hover:underline"
        >
          ← Terug naar gebruikers
        </Link>
      </div>

      {/* Profiel */}
      <section className="bg-white border rounded-lg p-6">
        <UserHeader profile={profile} />
      </section>

      {/* Credits */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <CreditsSummery wallet={wallet} />
        </div>

        <div className="bg-white border rounded-lg p-6">
          <CreditActions userId={profile.user_id} />
        </div>
      </section>

      {/* Credit history */}
      <section className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold mb-4">Credit history</h2>

        <CreditsHistoryTable transactions={transactions} />

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Pagina {pagination.page} van {pagination.totalPages}
          </span>

          <div className="flex gap-2">
            {pagination.page > 1 && (
              <Link
                href={`?page=${pagination.page - 1}`}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                ← Vorige
              </Link>
            )}

            {pagination.page < pagination.totalPages && (
              <Link
                href={`?page=${pagination.page + 1}`}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                Volgende →
              </Link>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
