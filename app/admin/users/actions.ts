"use server";

import { createAdminClient, supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth/getAdminUser";
import { grantCredits } from "@/lib/credits/grantCredits";
import { logSecurityAuditEvent } from "@/lib/security/audit";
import { invalidateUserSessions } from "@/lib/security/session";
import {
  normalizeAccessRole,
  normalizeTherapistProfileData,
  normalizeUserAccountType,
} from "@/lib/users/accountTypes";
import { THERAPIST_DIRECTORY_ENTITLEMENT_KEY } from "@/lib/users/entitlements";

export type CreateUserInput = {
  email: string;
  displayName?: string;
  role?: "user" | "admin";
  accountType?: "user" | "client" | "therapist";
  creditsInitial?: number;
  // kies 1 van beide flows:
  password?: string; // als je direct wachtwoord wil zetten
  sendInvite?: boolean; // als je email invite wil sturen (Supabase invite)
};

export async function createUser({
  email,
  password,
  sendInvite,
  displayName,
  role,
  accountType,
  creditsInitial,
}: {
  email: string;
  password?: string;
  sendInvite: boolean;
  displayName: string;
  role: "user" | "admin";
  accountType?: "user" | "client" | "therapist";
  creditsInitial: number;
}) {
  const accessRole = normalizeAccessRole(role);
  const nextAccountType =
    accessRole === "admin" ? "user" : normalizeUserAccountType(accountType);

  // 1️⃣ Auth
  const authResult = sendInvite
    ? await supabaseAdmin.auth.admin.inviteUserByEmail(email)
    : await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

  if (authResult.error || !authResult.data.user) {
    throw new Error("Auth user aanmaken mislukt");
  }

  const userId = authResult.data.user.id;

  // 2️⃣ Profile
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        display_name: displayName,
        role: accessRole,
        profile_data: {
          account_type: nextAccountType,
          account_approval_status: "approved",
          account_approved_at: new Date().toISOString(),
        },
      },
      { onConflict: "user_id" }
    );

  if (profileError) {
    throw new Error("Profiel aanmaken mislukt");
  }

  // 3️⃣ Wallet
  const { error: walletError } = await supabaseAdmin
    .from("credit_wallets")
    .upsert(
      {
        user_id: userId,
        credits_available: creditsInitial,
        credits_total_purchased: 0,
      },
      { onConflict: "user_id" }
    );

  if (walletError) {
    throw new Error("Credit wallet aanmaken mislukt");
  }

  // 4️⃣ Start credits (optioneel)
  if (creditsInitial > 0) {
    const { error: transactionError } = await supabaseAdmin
      .from("credit_transactions")
      .insert({
      user_id: userId,
      delta: creditsInitial,
      reason: "admin_initial",
    });

    if (transactionError) {
      throw new Error("Startcredits registreren mislukt");
    }
  }

  return { userId };
}

export async function adjustCredits(
  userId: string,
  delta: number
) {
  const admin = await getAdminUser();
  const result = await grantCredits({
    userId,
    amount: delta,
    reason: "admin_adjust",
  });

  await logSecurityAuditEvent({
    eventType: "credits_adjusted",
    actorUserId: admin?.id ?? null,
    targetUserId: userId,
    details: {
      delta,
      reason: "admin_adjust",
    },
  });

  return result;
}

export async function adminResetPassword(
  userId: string,
  newPassword: string
) {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Niet geautoriseerd");
  }

  if (newPassword.length < 8) {
    throw new Error("Wachtwoord moet minimaal 8 tekens zijn");
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    {
      password: newPassword,
      email_confirm: true, // zekerheid
    }
  );

  if (error) {
    console.error("ADMIN RESET PASSWORD ERROR:", error);
    throw new Error("Wachtwoord resetten mislukt");
  }

  await invalidateUserSessions({
    userIds: [userId],
    reason: "password_reset",
    updatedBy: admin.id,
  });

  await logSecurityAuditEvent({
    eventType: "password_reset_by_admin",
    severity: "warning",
    actorUserId: admin.id,
    targetUserId: userId,
  });
}
type UserRole = "user" | "admin";

type UserApprovalStatus = "approved" | "pending" | "rejected";

export async function updateUserRole(
  userId: string,
  role: UserRole
) {
  // 1️⃣ Check: alleen admins
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Niet geautoriseerd");
  }

  // 2️⃣ Validatie
  if (role !== "user" && role !== "admin") {
    throw new Error("Ongeldige rol");
  }

  const supabase = createAdminClient();

  const { data: previousProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle<{ role: UserRole }>();

  // 3️⃣ Update role in profiles
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("user_id", userId);

  if (error) {
    console.error("UPDATE ROLE ERROR:", error);
    throw new Error("Rol bijwerken mislukt");
  }

  await invalidateUserSessions({
    userIds: [userId],
    reason: "role_changed",
    updatedBy: admin.id,
  });

  await logSecurityAuditEvent({
    eventType: "user_role_updated",
    severity: "warning",
    actorUserId: admin.id,
    targetUserId: userId,
    details: {
      previousRole: previousProfile?.role ?? null,
      nextRole: role,
    },
  });

  return { success: true };
}

export async function updateUserApprovalStatus(
  userId: string,
  status: UserApprovalStatus
) {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Niet geautoriseerd");
  }

  if (!["approved", "pending", "rejected"].includes(status)) {
    throw new Error("Ongeldige accountstatus");
  }

  const supabase = createAdminClient();
  const { data: existingProfile, error: loadError } = await supabase
    .from("profiles")
    .select("profile_data")
    .eq("user_id", userId)
    .maybeSingle<{ profile_data?: Record<string, unknown> | null }>();

  if (loadError) {
    throw new Error("Profiel ophalen mislukt");
  }

  const nowIso = new Date().toISOString();
  const profileData = {
    ...(existingProfile?.profile_data ?? {}),
    account_approval_status: status,
    ...(status === "approved"
      ? { account_approved_at: nowIso, account_rejected_at: null }
      : status === "rejected"
        ? { account_rejected_at: nowIso, account_approved_at: null }
        : { account_approved_at: null, account_rejected_at: null }),
    account_approval_updated_at: nowIso,
    account_approval_updated_by: admin.id,
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      profile_data: profileData,
      updated_at: nowIso,
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error("Accountstatus bijwerken mislukt");
  }

  if (status !== "approved") {
    await invalidateUserSessions({
      userIds: [userId],
      reason: `account_${status}`,
      updatedBy: admin.id,
    });
  }

  await logSecurityAuditEvent({
    eventType: "user_approval_status_updated",
    severity: "warning",
    actorUserId: admin.id,
    targetUserId: userId,
    details: {
      status,
    },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);

  return { success: true };
}

export async function bulkUpdateUserRole(
  userIds: string[],
  role: "admin" | "user"
) {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Niet geautoriseerd");
  }

  if (userIds.length === 0) return;

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role })
    .in("user_id", userIds);

  if (error) {
    console.error("BULK ROLE UPDATE ERROR:", error);
    throw new Error("Bulk rol wijzigen mislukt");
  }

  await invalidateUserSessions({
    userIds,
    reason: "bulk_role_changed",
    updatedBy: admin.id,
  });

  await logSecurityAuditEvent({
    eventType: "bulk_user_role_updated",
    severity: "warning",
    actorUserId: admin.id,
    details: {
      affectedUsers: userIds.length,
      nextRole: role,
    },
  });
}

export async function updateUserProfileExtended(input: {
  userId: string;
  display_name?: string | null;
  language?: string;
  timezone?: string;
  profileData?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("profile_data")
    .eq("user_id", input.userId)
    .maybeSingle<{ profile_data?: Record<string, unknown> | null }>();

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.display_name !== undefined) {
    update.display_name = input.display_name;
  }

  if (input.language) update.language = input.language;
  if (input.timezone) update.timezone = input.timezone;

  if (input.profileData) {
    const mergedProfileData = {
      ...(existingProfile?.profile_data ?? {}),
      ...input.profileData,
    };

    if (mergedProfileData.therapist_profile === null) {
      mergedProfileData.therapist_profile = null;
    } else if ("therapist_profile" in mergedProfileData) {
      mergedProfileData.therapist_profile = normalizeTherapistProfileData(
        mergedProfileData.therapist_profile as Record<string, unknown> | null
      );
    }

    update.profile_data = mergedProfileData;
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("user_id", input.userId);

  if (error) {
    throw new Error("Profiel opslaan mislukt");
  }

  revalidatePath(`/admin/users/${input.userId}`);
  revalidatePath("/therapeuten");
}

export async function bulkDeleteUsers(userIds: string[]) {
  if (userIds.length === 0) return;

  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Niet geautoriseerd");
  }

  const safeUserIds = userIds.filter((userId) => userId !== admin.id);
  if (safeUserIds.length === 0) {
    return;
  }

  const supabase = createAdminClient();

  // Verwijderbare gebruikers kunnen nog als auteur of admin-ref voorkomen.
  // Deze relaties zijn nullable en moeten eerst losgekoppeld worden.
  const { error: contentOwnerError } = await supabase
    .from("content_items")
    .update({ created_by: null })
    .in("created_by", safeUserIds);

  if (contentOwnerError) {
    console.error("BULK DELETE CONTENT OWNER CLEANUP ERROR:", contentOwnerError);
    throw new Error("Content-auteur loskoppelen mislukt");
  }

  const { error: creditAdminError } = await supabase
    .from("credit_transactions")
    .update({ admin_id: null })
    .in("admin_id", safeUserIds);

  if (creditAdminError) {
    console.error("BULK DELETE CREDIT ADMIN CLEANUP ERROR:", creditAdminError);
    throw new Error("Creditgeschiedenis loskoppelen mislukt");
  }

  for (const userId of safeUserIds) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error("BULK DELETE USERS ERROR:", error);
      throw new Error("Gebruikers verwijderen mislukt");
    }
  }

  await logSecurityAuditEvent({
    eventType: "users_deleted_by_admin",
    severity: "warning",
    actorUserId: admin.id,
    details: {
      affectedUsers: safeUserIds.length,
      userIds: safeUserIds,
    },
  });

  revalidatePath("/admin/users");
}

export async function deactivateYearAssignmentsEntitlement(input: {
  entitlementId: string;
  userId: string;
}) {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Niet geautoriseerd");
  }

  if (!input.entitlementId) {
    throw new Error("entitlementId ontbreekt");
  }
  if (!input.userId) {
    throw new Error("userId ontbreekt");
  }

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from("user_entitlements")
    .update({
      is_active: false,
      ends_at: nowIso,
    })
    .eq("id", input.entitlementId)
    .eq("user_id", input.userId)
    .eq("entitlement_key", "year_assignments");

  if (error) {
    throw new Error("Jaarabonnement beëindigen mislukt");
  }

  revalidatePath(`/admin/users/${input.userId}`);
  revalidatePath("/admin/administration");
}

export async function deactivateTherapistDirectoryEntitlement(input: {
  entitlementId: string;
  userId: string;
}) {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Niet geautoriseerd");
  }

  if (!input.entitlementId) {
    throw new Error("entitlementId ontbreekt");
  }
  if (!input.userId) {
    throw new Error("userId ontbreekt");
  }

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from("user_entitlements")
    .update({
      is_active: false,
      ends_at: nowIso,
    })
    .eq("id", input.entitlementId)
    .eq("user_id", input.userId)
    .eq("entitlement_key", THERAPIST_DIRECTORY_ENTITLEMENT_KEY);

  if (error) {
    throw new Error("Therapeut-abonnement beëindigen mislukt");
  }

  revalidatePath(`/admin/users/${input.userId}`);
  revalidatePath("/admin/administration");
  revalidatePath("/therapeuten");
}
