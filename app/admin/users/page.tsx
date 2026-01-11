import { supabaseAdmin } from "@/lib/supabase-admin";
import { adjustCredits } from "./actions";
import Link from "next/link";

type AdminUser = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: "user" | "admin" | "editor";
  credits_available: number | null;
  credits_total_purchased: number | null;
  created_at: string;
};

export default async function AdminUsersPage() {
  const { data: users, error } = await supabaseAdmin
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("ADMIN_USERS ERROR:", error);
    return (
      <div className="p-6 text-red-600">
        Failed to load users
        <pre className="mt-4 text-xs text-gray-600">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin — Users</h1>

      {(!users || users.length === 0) && (
        <div className="text-gray-500">No users found.</div>
      )}

      {users && users.length > 0 && (
        <table className="w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1 text-left">Email</th>
              <th className="border px-2 py-1 text-left">Display name</th>
              <th className="border px-2 py-1 text-left">Role</th>
              <th className="border px-2 py-1 text-right">Credits</th>
              <th className="border px-2 py-1 text-right">Purchased</th>
              <th className="border px-2 py-1 text-left">Created</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u: AdminUser) => (
              <tr key={u.user_id} className="hover:bg-gray-50">
                <td className="border px-2 py-1">
                  {u.email ?? "—"}
                </td>

                <td className="border px-2 py-1">
                  {u.display_name ? (
                    <Link
                      href={`/admin/users/${u.user_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {u.display_name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>

                <td className="border px-2 py-1">
                  {u.role}
                </td>

                <td className="border px-2 py-1 text-right">
                  {u.credits_available ?? 0}
                </td>

                <td className="border px-2 py-1 text-right">
                  {u.credits_total_purchased ?? 0}
                </td>

                <td className="border px-2 py-1">
                  {new Date(u.created_at).toLocaleDateString("nl-NL")}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
