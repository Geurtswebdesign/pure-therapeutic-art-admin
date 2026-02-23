"use server";

import { createAdminClient, supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth/getAdminUser";
import { grantCredits } from "@/lib/credits/grantCredits";

export type CreateUserInput = {
  email: string;
  displayName?: string;
  role?: "user" | "admin";
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
  creditsInitial,
}: {
  email: string;
  password?: string;
  sendInvite: boolean;
  displayName: string;
  role: "user" | "admin";
  creditsInitial: number;
}) {
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
  await supabaseAdmin.from("profiles").update({
    display_name: displayName,
    role,
  }).eq("user_id", userId);

  // 3️⃣ Wallet
  await supabaseAdmin.from("credit_wallets").insert({
    user_id: userId,
    credits_available: creditsInitial,
    credits_total_purchased: 0,
  });

  // 4️⃣ Start credits (optioneel)
  if (creditsInitial > 0) {
    await supabaseAdmin.from("credit_transactions").insert({
      user_id: userId,
      delta: creditsInitial,
      reason: "admin_initial",
    });
  }

  return { userId };
}

export async function adjustCredits(
  userId: string,
  delta: number
) {
  return grantCredits({
    userId,
    amount: delta,
    reason: "admin_adjust",
  });
}

export async function adminResetPassword(
  userId: string,
  newPassword: string
) {
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
}
type UserRole = "user" | "admin";

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

  // 3️⃣ Update role in profiles
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("user_id", userId);

  if (error) {
    console.error("UPDATE ROLE ERROR:", error);
    throw new Error("Rol bijwerken mislukt");
  }

  return { success: true };
}

export async function bulkUpdateUserRole(
  userIds: string[],
  role: "admin" | "user"
) {
  if (userIds.length === 0) return;

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role })
    .in("user_id", userIds);

  if (error) {
    console.error("BULK ROLE UPDATE ERROR:", error);
    throw new Error("Bulk rol wijzigen mislukt");
  }
}

export async function updateUserProfileExtended(input: {
  userId: string;
  display_name?: string | null;
  language?: "nl" | "en";
  timezone?: string;
  profileData?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.display_name !== undefined) {
    update.display_name = input.display_name;
  }

  if (input.language) update.language = input.language;
  if (input.timezone) update.timezone = input.timezone;

  if (input.profileData) {
    update.profile_data = input.profileData;
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("user_id", input.userId);

  if (error) {
    throw new Error("Profiel opslaan mislukt");
  }

  revalidatePath(`/admin/users/${input.userId}`);
}

export async function bulkDeleteUsers(userIds: string[]) {
  if (userIds.length === 0) return;

  // ❗ Auth users verwijderen
  // Supabase zorgt via FK + triggers voor cascade
  for (const userId of userIds) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error("BULK DELETE USERS ERROR:", error);
      throw new Error("Gebruikers verwijderen mislukt");
    }
  }
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
