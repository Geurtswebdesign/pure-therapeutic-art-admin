import { supabaseAdmin } from "@/lib/supabase-admin";
import { adjustCredits } from "./actions";

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
              <th className="border px-2 py-1 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u: AdminUser) => (
              <tr key={u.user_id} className="hover:bg-gray-50">
                <td className="border px-2 py-1">
                  {u.email ?? "—"}
                </td>

                <td className="border px-2 py-1">
                  {u.display_name ?? "—"}
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

                <td className="border px-2 py-1 text-center space-y-1">
                  {/* +10 / -10 blijft */}
                  <div className="space-x-2">
                    <form
                      action={async () => {
                        "use server";
                        await adjustCredits(u.user_id, 10);
                      }}
                      className="inline"
                    >
                      <button className="px-2 py-1 text-xs border rounded">
                        +10
                      </button>
                    </form>

                    <form
                      action={async () => {
                        "use server";
                        await adjustCredits(u.user_id, -10);
                      }}
                      className="inline"
                    >
                      <button className="px-2 py-1 text-xs border rounded">
                        −10
                      </button>
                    </form>
                  </div>

                  {/* Vrij bedrag */}
                  <form
                    action={async (formData) => {
                      "use server";
                      const delta = Number(formData.get("delta"));
                      if (!Number.isNaN(delta) && delta !== 0) {
                        await adjustCredits(u.user_id, delta);
                      }
                    }}
                    className="flex gap-1 justify-center"
                  >
                    <input
                      type="number"
                      name="delta"
                      placeholder="+ / −"
                      className="w-20 border px-1 py-0.5 text-xs rounded"
                    />
                    <button
                      type="submit"
                      className="px-2 py-0.5 text-xs border rounded"
                    >
                      Apply
                    </button>
                  </form>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
