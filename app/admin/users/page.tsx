import { supabaseAdmin } from "@/lib/supabase/admin";
import UsersTableClient from "@/components/admin/UsersTableClient";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getAdminUser } from "@/lib/auth/getAdminUser";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import {
  getProfileAccountType,
  getTherapistProfileData,
  type AppProfileData,
  type UserAccountType,
} from "@/lib/users/accountTypes";
import {
  THERAPIST_DIRECTORY_ENTITLEMENT_KEY,
  YEAR_ASSIGNMENTS_ENTITLEMENT_KEY,
  isTimedEntitlementActive,
} from "@/lib/users/entitlements";

type ProfileRow = {
  user_id: string;
  profile_data?: AppProfileData | null;
};

type SubscriptionSummary = {
  hasYearAssignments: boolean;
  yearAssignmentsActiveUntil: string | null;
  hasTherapistDirectory: boolean;
  therapistDirectoryActiveUntil: string | null;
};

type DirectoryVisibilitySummary = {
  accountType: UserAccountType;
  publicProfileEnabled: boolean;
  isVisibleInTherapistDirectory: boolean;
};

type UserEntitlementRow = {
  user_id: string;
  entitlement_key: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean | null;
};

type AdminUsersPageRow = {
  id?: string | null;
  email?: string | null;
  display_name?: string | null;
  role?: "user" | "admin" | null;
  credits?: number | null;
  created_at?: string | null;
};

type ApprovalStatus = "approved" | "pending" | "rejected";

type AdminUsersClientRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: "user" | "admin";
  credits: number;
  created_at: string | null;
  approval_status: ApprovalStatus;
  subscriptions: SubscriptionSummary;
  directoryVisibility: DirectoryVisibilitySummary;
};

function getActiveSubscriptionSummary(
  rows: UserEntitlementRow[],
  entitlementKey: string,
  nowIso: string
) {
  let latest: string | null = null;
  let hasActive = false;

  for (const row of rows) {
    if (row.entitlement_key !== entitlementKey) {
      continue;
    }

    if (!isTimedEntitlementActive(row, nowIso)) {
      continue;
    }

    hasActive = true;

    if (!row.ends_at) {
      return { hasActive, activeUntil: null };
    }

    if (!latest || row.ends_at > latest) {
      latest = row.ends_at;
    }
  }

  return { hasActive, activeUntil: latest };
}

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
        .returns<ProfileRow[]>()
    : { data: [] };
  const { data: entitlements } = userIds.length
    ? await supabaseAdmin
        .from("user_entitlements")
        .select("user_id, entitlement_key, starts_at, ends_at, is_active")
        .in("user_id", userIds)
        .in("entitlement_key", [
          YEAR_ASSIGNMENTS_ENTITLEMENT_KEY,
          THERAPIST_DIRECTORY_ENTITLEMENT_KEY,
        ])
        .returns<UserEntitlementRow[]>()
    : { data: [] as UserEntitlementRow[] };
  const approvalStatusByUserId = new Map(
    (profiles ?? []).map((profile) => [
      profile.user_id,
      profile.profile_data &&
      typeof profile.profile_data === "object" &&
      !Array.isArray(profile.profile_data)
        ? (profile.profile_data as Record<string, unknown>).account_approval_status
        : null,
    ])
  );
  const directoryVisibilityByUserId = new Map<string, DirectoryVisibilitySummary>();
  for (const profile of profiles ?? []) {
    const accountType = getProfileAccountType(profile.profile_data ?? null);
    const therapistProfile = getTherapistProfileData(profile.profile_data ?? null);
    directoryVisibilityByUserId.set(profile.user_id, {
      accountType,
      publicProfileEnabled: Boolean(therapistProfile.public_profile_enabled),
      isVisibleInTherapistDirectory: false,
    });
  }
  const entitlementsByUserId = new Map<string, UserEntitlementRow[]>();
  for (const entitlement of entitlements ?? []) {
    const current = entitlementsByUserId.get(entitlement.user_id) ?? [];
    current.push(entitlement);
    entitlementsByUserId.set(entitlement.user_id, current);
  }
  const nowIso = new Date().toISOString();
  const subscriptionByUserId = new Map<string, SubscriptionSummary>();
  for (const userId of userIds) {
    const rows = entitlementsByUserId.get(userId) ?? [];
    const yearAssignments = getActiveSubscriptionSummary(
      rows,
      YEAR_ASSIGNMENTS_ENTITLEMENT_KEY,
      nowIso
    );
    const therapistDirectory = getActiveSubscriptionSummary(
      rows,
      THERAPIST_DIRECTORY_ENTITLEMENT_KEY,
      nowIso
    );
    subscriptionByUserId.set(userId, {
      hasYearAssignments: yearAssignments.hasActive,
      yearAssignmentsActiveUntil: yearAssignments.activeUntil,
      hasTherapistDirectory: therapistDirectory.hasActive,
      therapistDirectoryActiveUntil: therapistDirectory.activeUntil,
    });
  }
  const userRows = ((users ?? []) as AdminUsersPageRow[]).filter(
    (user): user is AdminUsersPageRow & { id: string } => Boolean(user.id)
  );
  const missingCreatedAtUserIds: string[] = userRows
    .filter((user) => Boolean(user.id) && !user.created_at)
    .map((user) => user.id)
    .filter((id: string | null | undefined): id is string => Boolean(id));
  const authCreatedAtByUserId = new Map<string, string>();
  await Promise.all(
    missingCreatedAtUserIds.map(async (userId) => {
      const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
      const createdAt = data.user?.created_at ?? null;
      if (createdAt) {
        authCreatedAtByUserId.set(userId, createdAt);
      }
    })
  );
  const usersWithApprovalStatus: AdminUsersClientRow[] = userRows.map((user) => {
    const rawStatus = approvalStatusByUserId.get(user.id);
    const approval_status: ApprovalStatus =
      rawStatus === "pending" || rawStatus === "rejected" || rawStatus === "approved"
        ? rawStatus
        : "approved";
    const subscriptions = subscriptionByUserId.get(user.id) ?? {
      hasYearAssignments: false,
      yearAssignmentsActiveUntil: null,
      hasTherapistDirectory: false,
      therapistDirectoryActiveUntil: null,
    };
    const directoryVisibility = directoryVisibilityByUserId.get(user.id) ?? {
      accountType: "user" as const,
      publicProfileEnabled: false,
      isVisibleInTherapistDirectory: false,
    };
    const nextDirectoryVisibility = {
      ...directoryVisibility,
      isVisibleInTherapistDirectory:
        directoryVisibility.accountType === "therapist" &&
        directoryVisibility.publicProfileEnabled &&
        subscriptions.hasTherapistDirectory,
    };

    return {
      id: user.id,
      email: user.email ?? null,
      display_name: user.display_name ?? null,
      role: user.role === "admin" ? "admin" : "user",
      credits: typeof user.credits === "number" ? user.credits : 0,
      created_at:
        typeof user.created_at === "string"
          ? user.created_at
          : authCreatedAtByUserId.get(user.id) ?? null,
      approval_status,
      subscriptions,
      directoryVisibility: nextDirectoryVisibility,
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
