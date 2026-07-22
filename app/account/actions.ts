"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { logSecurityAuditEvent } from "@/lib/security/audit";
import { getSupabaseCookieOptions } from "@/lib/site/urls";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_LANGUAGE_COOKIE_NAME } from "@/lib/i18n/language-cookie";
import { isKnownLanguage, normalizeLanguageCode } from "@/lib/i18n/languages";
import { getSupportedLanguageCodes } from "@/lib/i18n/settings";
import { getTherapistDirectoryEntitlementSummary } from "@/lib/users/therapistDirectoryAccess";
import {
  normalizeTherapistProfileData,
  type AppProfileData,
  type TherapistProfileData,
  type UserAccountType,
} from "@/lib/users/accountTypes";

function normalizeText(value?: string) {
  return value?.trim() ?? "";
}

type PasswordChangeErrorCode =
  | "PASSWORD_NOT_AUTHENTICATED"
  | "PASSWORD_CURRENT_REQUIRED"
  | "PASSWORD_TOO_SHORT"
  | "PASSWORD_MUST_DIFFER"
  | "PASSWORD_CURRENT_INCORRECT"
  | "PASSWORD_MFA_REQUIRED"
  | "PASSWORD_MFA_UNAVAILABLE"
  | "PASSWORD_MFA_FAILED"
  | "PASSWORD_MFA_INVALID"
  | "PASSWORD_UPDATE_FAILED";

function passwordChangeFailed(code: PasswordChangeErrorCode) {
  return { ok: false as const, code };
}

export async function updateMyPassword(input: {
  currentPassword: string;
  newPassword: string;
  mfaCode?: string;
}) {
  const user = await getCurrentUser();
  if (!user?.email) {
    return passwordChangeFailed("PASSWORD_NOT_AUTHENTICATED");
  }

  if (!input.currentPassword) {
    return passwordChangeFailed("PASSWORD_CURRENT_REQUIRED");
  }
  if (input.newPassword.length < 8) {
    return passwordChangeFailed("PASSWORD_TOO_SHORT");
  }
  if (input.currentPassword === input.newPassword) {
    return passwordChangeFailed("PASSWORD_MUST_DIFFER");
  }

  // Verify the current password without replacing the user's existing session.
  // Reusing the cookie client for signInWithPassword would downgrade an AAL2
  // session to AAL1 and make Supabase reject the password update.
  const credentialVerifier = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );

  const { error: verifyError } = await credentialVerifier.auth.signInWithPassword({
    email: user.email,
    password: input.currentPassword,
  });
  if (verifyError) {
    await logSecurityAuditEvent({
      eventType: "password_change_verification_failed",
      severity: "warning",
      actorUserId: user.id,
      targetUserId: user.id,
    });
    return passwordChangeFailed("PASSWORD_CURRENT_INCORRECT");
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getSupabaseCookieOptions(),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError) {
    return passwordChangeFailed("PASSWORD_MFA_FAILED");
  }
  if (
    assurance?.nextLevel === "aal2" &&
    assurance.currentLevel !== "aal2"
  ) {
    if (!input.mfaCode?.trim()) {
      return passwordChangeFailed("PASSWORD_MFA_REQUIRED");
    }

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp?.find((item) => item.status === "verified");
    if (!factor) {
      return passwordChangeFailed("PASSWORD_MFA_UNAVAILABLE");
    }

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challengeError || !challenge?.id) {
      return passwordChangeFailed("PASSWORD_MFA_FAILED");
    }

    const { error: mfaError } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challenge.id,
      code: input.mfaCode.trim(),
    });
    if (mfaError) {
      return passwordChangeFailed("PASSWORD_MFA_INVALID");
    }
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: input.newPassword,
  });
  if (updateError) {
    return passwordChangeFailed("PASSWORD_UPDATE_FAILED");
  }

  await logSecurityAuditEvent({
    eventType: "password_changed_by_user",
    actorUserId: user.id,
    targetUserId: user.id,
  });

  return { ok: true as const };
}

export async function updateMyProfile(input: {
  displayName?: string;
  bio?: string;
  firstName?: string;
  lastName?: string;
  website?: string;
  avatarUrl?: string;
  accountType?: UserAccountType;
  therapistProfile?: Partial<TherapistProfileData> | null;
}) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Niet ingelogd");
  }

  const supabase = createAdminClient();
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("profile_data")
    .eq("user_id", user.id)
    .maybeSingle<{ profile_data?: AppProfileData | null }>();

  const accountType =
    input.accountType ??
    profileRow?.profile_data?.account_type ??
    "user";
  const therapistDirectoryEntitlement =
    accountType === "therapist"
      ? await getTherapistDirectoryEntitlementSummary(user.id)
      : null;

  let nextTherapistProfile =
    input.therapistProfile === null
      ? null
      : input.therapistProfile
        ? normalizeTherapistProfileData(input.therapistProfile)
        : profileRow?.profile_data?.therapist_profile ?? null;

  if (
    accountType === "therapist" &&
    nextTherapistProfile &&
    therapistDirectoryEntitlement?.status !== "active"
  ) {
    nextTherapistProfile = {
      ...nextTherapistProfile,
      public_profile_enabled: false,
    };
  }

  const nextProfileData = {
    ...(profileRow?.profile_data ?? {}),
    bio: normalizeText(input.bio),
    first_name: normalizeText(input.firstName),
    last_name: normalizeText(input.lastName),
    nickname: "",
    website: normalizeText(input.website),
    avatar_url: normalizeText(input.avatarUrl),
    account_type: accountType,
    therapist_profile: nextTherapistProfile,
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: normalizeText(input.displayName) || null,
      profile_data: nextProfileData,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Profiel opslaan mislukt");
  }

  revalidatePath("/account");
  revalidatePath("/therapeuten");
}

export async function updateMyPreferredLanguage(languageCode: string) {
  const user = await getCurrentUser();
  const normalizedCode = normalizeLanguageCode(languageCode);
  const supportedLanguages = await getSupportedLanguageCodes();
  if (!isKnownLanguage(normalizedCode, supportedLanguages)) {
    throw new Error("Ongeldige taal");
  }

  if (!user) {
    (await cookies()).set(APP_LANGUAGE_COOKIE_NAME, normalizedCode, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    revalidatePath("/");
    revalidatePath("/account");
    revalidatePath("/content");
    revalidatePath("/therapeuten");
    revalidatePath("/login");
    return;
  }

  const supabase = createAdminClient();
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("profile_data")
    .eq("user_id", user.id)
    .maybeSingle<{ profile_data?: AppProfileData | null }>();

  const nextProfileData = {
    ...(profileRow?.profile_data ?? {}),
    preferred_language: normalizedCode,
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      profile_data: nextProfileData,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Taal opslaan mislukt");
  }

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/content");
  revalidatePath("/therapeuten");
  revalidatePath("/login");
}

export async function setMySubscriptionCancellationPreference(input: {
  entitlementKey: string;
  cancelAtPeriodEnd: boolean;
}) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Niet ingelogd");
  }

  if (
    input.entitlementKey !== "year_assignments" &&
    input.entitlementKey !== "therapist_directory"
  ) {
    throw new Error("Ongeldig abonnement");
  }

  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data: rows, error } = await supabase
    .from("user_entitlements")
    .select("id, starts_at, ends_at, is_active, metadata")
    .eq("user_id", user.id)
    .eq("entitlement_key", input.entitlementKey)
    .returns<
      Array<{
        id: string;
        starts_at: string;
        ends_at: string | null;
        is_active: boolean;
        metadata?: Record<string, unknown> | null;
      }>
    >();

  if (error) {
    throw new Error("Abonnementen laden mislukt");
  }

  const relevantRows = (rows ?? []).filter((row) => {
    if (!row.is_active && (!row.ends_at || row.ends_at <= nowIso)) {
      return false;
    }

    if (row.starts_at > nowIso) {
      return true;
    }

    if (!row.ends_at) {
      return true;
    }

    return row.ends_at > nowIso;
  });

  await Promise.all(
    relevantRows.map((row) => {
      const metadata = {
        ...(row.metadata ?? {}),
        cancel_at_period_end: input.cancelAtPeriodEnd,
        cancel_requested_at: input.cancelAtPeriodEnd ? nowIso : null,
      };

      return supabase
        .from("user_entitlements")
        .update({
          metadata,
        })
        .eq("id", row.id);
    })
  );

  revalidatePath("/account");
}
