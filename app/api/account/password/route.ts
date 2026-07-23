import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { logSecurityAuditEvent } from "@/lib/security/audit";
import { getSupabaseCookieOptions } from "@/lib/site/urls";
import { createAdminClient } from "@/lib/supabase/admin";

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
  | "PASSWORD_POLICY_REJECTED"
  | "PASSWORD_SERVICE_UNAUTHORIZED"
  | "PASSWORD_UPDATE_FAILED";

function failed(code: PasswordChangeErrorCode, status = 400) {
  return NextResponse.json({ ok: false as const, code }, { status });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const requestHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && requestHost) {
    try {
      if (new URL(origin).host !== requestHost) {
        return failed("PASSWORD_NOT_AUTHENTICATED", 403);
      }
    } catch {
      return failed("PASSWORD_NOT_AUTHENTICATED", 403);
    }
  }

  let input: {
    currentPassword?: string;
    newPassword?: string;
    mfaCode?: string;
  };
  try {
    input = await request.json();
  } catch {
    return failed("PASSWORD_UPDATE_FAILED");
  }

  const user = await getCurrentUser();
  if (!user?.email) return failed("PASSWORD_NOT_AUTHENTICATED", 401);
  if (!input.currentPassword) return failed("PASSWORD_CURRENT_REQUIRED");
  if (!input.newPassword || input.newPassword.length < 8) {
    return failed("PASSWORD_TOO_SHORT");
  }
  if (input.currentPassword === input.newPassword) {
    return failed("PASSWORD_MUST_DIFFER");
  }

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
  const { error: verifyError } =
    await credentialVerifier.auth.signInWithPassword({
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
    return failed("PASSWORD_CURRENT_INCORRECT");
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getSupabaseCookieOptions(),
      cookies: {
        getAll: () => cookieStore.getAll(),
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
  if (assuranceError) return failed("PASSWORD_MFA_FAILED");

  if (
    assurance?.nextLevel === "aal2" &&
    assurance.currentLevel !== "aal2"
  ) {
    if (!input.mfaCode?.trim()) return failed("PASSWORD_MFA_REQUIRED");

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp?.find((item) => item.status === "verified");
    if (!factor) return failed("PASSWORD_MFA_UNAVAILABLE");

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challengeError || !challenge?.id) {
      return failed("PASSWORD_MFA_FAILED");
    }

    const { error: mfaError } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challenge.id,
      code: input.mfaCode.trim(),
    });
    if (mfaError) return failed("PASSWORD_MFA_INVALID");
  }

  const supabaseAdmin = createAdminClient();
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { password: input.newPassword }
  );
  if (updateError) {
    const safeErrorDetails = {
      code: updateError.code ?? "unknown",
      status: updateError.status ?? null,
      name: updateError.name,
    };
    console.error("[account-password] Supabase admin update failed", safeErrorDetails);
    await logSecurityAuditEvent({
      eventType: "password_change_update_failed",
      severity: "warning",
      actorUserId: user.id,
      targetUserId: user.id,
      details: safeErrorDetails,
    });

    if (updateError.code === "same_password") {
      return failed("PASSWORD_MUST_DIFFER");
    }
    if (
      updateError.code === "weak_password" ||
      updateError.code === "validation_failed"
    ) {
      return failed("PASSWORD_POLICY_REJECTED");
    }
    if (updateError.status === 401 || updateError.status === 403) {
      return failed("PASSWORD_SERVICE_UNAUTHORIZED", 503);
    }
    return failed("PASSWORD_UPDATE_FAILED", 500);
  }

  await logSecurityAuditEvent({
    eventType: "password_changed_by_user",
    actorUserId: user.id,
    targetUserId: user.id,
  });

  return NextResponse.json({ ok: true as const });
}
