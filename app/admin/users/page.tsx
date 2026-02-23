import { supabaseAdmin } from "@/lib/supabase/admin";
import UsersTableClient from "@/components/admin/UsersTableClient";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getAdminUser } from "@/lib/auth/getAdminUser";

export default async function AdminUsersPage() {
  // 🔐 Admin check (eerst!)
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Niet geautoriseerd");
  }

  // ✅ Admin users ophalen via RPC (ipv view)
  const { data: users, error } = await supabaseAdmin
    .rpc("get_admin_users");

  if (error) {
    console.error("ADMIN USERS LOAD ERROR:", error);
    throw new Error("Gebruikers konden niet geladen worden");
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gebruikers"
        description="Beheer gebruikers, rollen en credits"
      />

      <UsersTableClient
        users={users ?? []}
        currentAdminId={admin.id}
      />
    </div>
  );
}
