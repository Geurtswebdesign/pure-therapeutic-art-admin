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

  const userIds = (users ?? [])
    .map((user: { id?: string | null }) => user.id)
    .filter((id: string | null | undefined): id is string => Boolean(id));
  const { data: profiles } = userIds.length
    ? await supabaseAdmin
        .from("profiles")
        .select("user_id, profile_data")
        .in("user_id", userIds)
    : { data: [] };
  const approvalStatusByUserId = new Map(
    (profiles ?? []).map((profile) => [
      profile.user_id as string,
      profile.profile_data &&
      typeof profile.profile_data === "object" &&
      !Array.isArray(profile.profile_data)
        ? (profile.profile_data as Record<string, unknown>).account_approval_status
        : null,
    ])
  );
  const usersWithApprovalStatus = (users ?? []).map((user: { id?: string | null }) => {
    const rawStatus = user.id ? approvalStatusByUserId.get(user.id) : null;
    const approval_status =
      rawStatus === "pending" || rawStatus === "rejected" || rawStatus === "approved"
        ? rawStatus
        : "approved";

    return {
      ...user,
      approval_status,
    };
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t.title}
        description={t.description}
      />

      <UsersTableClient
        users={usersWithApprovalStatus}
        currentAdminId={admin.id}
        language={language}
      />
    </div>
  );
}
