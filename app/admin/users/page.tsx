import { supabaseAdmin } from "@/lib/supabase/admin";
import UsersTableClient from "@/components/admin/UsersTableClient";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getAdminUser } from "@/lib/auth/getAdminUser";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAdminMessages } from "@/lib/i18n/adminMessages";

export default async function AdminUsersPage() {
  const language = resolveUiLanguage(await getPrimaryLanguage());
  const t = getAdminMessages(language).usersPage;

  // 🔐 Admin check (eerst!)
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error(t.unauthorized);
  }

  // ✅ Admin users ophalen via RPC (ipv view)
  const { data: users, error } = await supabaseAdmin
    .rpc("get_admin_users");

  if (error) {
    console.error("ADMIN USERS LOAD ERROR:", error);
    throw new Error(t.loadFailed);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t.title}
        description={t.description}
      />

      <UsersTableClient
        users={users ?? []}
        currentAdminId={admin.id}
        language={language}
      />
    </div>
  );
}
