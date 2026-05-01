"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getRuntimeSecuritySettings } from "@/lib/security/runtime";
import { logSecurityAuditEvent } from "@/lib/security/audit";
import { sendMail } from "@/lib/mail/sendMail";
import { logServerEvent } from "@/lib/analytics/server";
import { isAdminRole } from "@/lib/users/accountTypes";
import type { UserAccountType } from "@/lib/users/accountTypes";
import {
  getAdminAreaUrl,
  getAdminLoginUrl,
  getPublicAreaUrl,
  getRequestHost,
  isAdminHost,
  getServerCookieOptions,
} from "@/lib/site/urls";
import { getActiveTherapistSubscriptionPack } from "@/lib/users/therapistSubscriptionPacks";
import type { TherapistSubscriptionPlan } from "@/lib/users/entitlements";

async function maybeSendSecurityAlert(input: {
  email: string;
  ipAddress: string | null;
  userAgent: string | null;
  reason: string;
  blockedMinutes: number;
}) {
  const supabaseAdmin = createAdminClient();
  const alertKey = `login_bruteforce:${input.email}:${input.ipAddress ?? "unknown"}`;
  const alertWindowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count } = await supabaseAdmin
    .from("security_alert_events")
    .select("id", { count: "exact", head: true })
    .eq("alert_key", alertKey)
    .gte("created_at", alertWindowStart);

  if (typeof count === "number" && count > 0) return;

  await supabaseAdmin.from("security_alert_events").insert({
    alert_key: alertKey,
    channel: "email",
    metadata: {
      email: input.email,
      ip: input.ipAddress,
      user_agent: input.userAgent,
      reason: input.reason,
      blocked_minutes: input.blockedMinutes,
    },
  });

  const { data: senders } = await supabaseAdmin
    .from("email_sender_profiles")
    .select("key, email, is_active")
    .in("key", ["techsupport", "klantenservice"]);

  const recipients = (senders ?? [])
    .filter((sender) => sender.is_active && sender.email)
    .map((sender) => sender.email as string);

  if (!recipients.length) return;

  const fromAddress =
    (senders ?? []).find((sender) => sender.key === "techsupport" && sender.email)
      ?.email ??
    process.env.GOOGLE_SENDER_EMAIL;

  if (!fromAddress) return;

  const subject = "Beveiligingsmelding: verdachte loginactiviteit";
  const html = `
    <h1>Beveiligingsmelding</h1>
    <p>Er is verdachte loginactiviteit gedetecteerd.</p>
    <p><strong>E-mail:</strong> ${input.email}</p>
    <p><strong>IP:</strong> ${input.ipAddress ?? "onbekend"}</p>
    <p><strong>Reden:</strong> ${input.reason}</p>
    <p><strong>Blokkade:</strong> ${input.blockedMinutes} minuten</p>
  `;

  for (const recipient of recipients) {
    try {
      await sendMail({
        to: recipient,
        subject,
        html,
        fromName: "Security Monitor",
        fromEmail: fromAddress,
      });
    } catch {
      // Non-blocking alert channel
    }
  }
}

function resolveFrontendAccountType(): UserAccountType {
  return "therapist";
}

function resolveTherapistSubscriptionPlan(
  value: string
): TherapistSubscriptionPlan | null {
  if (value === "monthly" || value === "yearly") {
    return value;
  }

  return null;
}

function getPublicLoginUrl(params?: Record<string, string | null | undefined>) {
  const url = new URL("/login", "http://local");

  for (const [key, value] of Object.entries(params ?? {})) {
    if (!value) continue;
    url.searchParams.set(key, value);
  }

  return `${url.pathname}${url.search}`;
}

function getScopedLoginUrl(
  params: Record<string, string | null | undefined>,
  adminHostRequest: boolean,
  requestHost: string | null
) {
  return adminHostRequest
    ? getAdminLoginUrl(params, requestHost)
    : getPublicLoginUrl(params);
}

function isUnconfirmedEmailError(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "email_not_confirmed" ||
    error?.message?.toLowerCase().includes("email not confirmed")
  );
}

function isApprovedProfileData(profileData: unknown) {
  if (!profileData || typeof profileData !== "object" || Array.isArray(profileData)) {
    return true;
  }

  const status = (profileData as Record<string, unknown>).account_approval_status;
  return status === undefined || status === null || status === "approved";
}

async function confirmApprovedAuthEmail(input: {
  email: string;
  supabaseAdmin: ReturnType<typeof createAdminClient>;
}) {
  const { data: users } = await input.supabaseAdmin.rpc("get_admin_users");
  const matchingUser = ((users ?? []) as Array<{ id?: string; email?: string | null }>).find(
    (user) => user.email?.toLowerCase() === input.email
  );

  if (!matchingUser?.id) {
    return false;
  }

  const { data: profile, error: profileError } = await input.supabaseAdmin
    .from("profiles")
    .select("profile_data")
    .eq("user_id", matchingUser.id)
    .maybeSingle<{ profile_data?: Record<string, unknown> | null }>();

  if (profileError || !isApprovedProfileData(profile?.profile_data)) {
    return false;
  }

  const { error } = await input.supabaseAdmin.auth.admin.updateUserById(
    matchingUser.id,
    { email_confirm: true }
  );

  return !error;
}

export async function registerAccount(formData: FormData) {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const accountType = resolveFrontendAccountType();
  const therapistPlan = resolveTherapistSubscriptionPlan(
    String(formData.get("therapist_plan") ?? "").trim()
  );
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim();

  if (!firstName || !lastName || !email || password.length < 8) {
    redirect("/login?mode=register&error=register");
  }

  const selectedTherapistPack = therapistPlan
    ? await getActiveTherapistSubscriptionPack(therapistPlan)
    : null;

  if (therapistPlan && !selectedTherapistPack) {
    redirect("/login?mode=register&error=therapist-pack");
  }

  const supabaseAdmin = createAdminClient();

  await logServerEvent({
    eventName: "register_submit",
    eventCategory: "auth",
    eventLabel: therapistPlan ? `therapist:${therapistPlan}` : "therapist:free",
    path: "/login",
  });

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
    },
  });

  if (error || !data.user) {
    await logServerEvent({
      eventName: "register_failed",
      eventCategory: "auth",
      eventLabel: error?.message ?? "unknown",
      path: "/login",
    });
    redirect("/login?mode=register&error=register");
  }

  const userId = data.user.id;

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
    {
      user_id: userId,
      display_name: displayName || null,
      role: "user",
      profile_data: {
        first_name: firstName,
        last_name: lastName,
        account_type: accountType,
        account_approval_status: "pending",
        account_approval_requested_at: new Date().toISOString(),
        therapist_subscription_preference: selectedTherapistPack
          ? {
              plan: selectedTherapistPack.plan,
              pack_id: selectedTherapistPack.id,
              pack_slug: selectedTherapistPack.slug,
              pack_name: selectedTherapistPack.name,
              amount_cents: selectedTherapistPack.price_cents,
              currency: selectedTherapistPack.currency,
              selected_at: new Date().toISOString(),
            }
          : null,
      },
    },
    { onConflict: "user_id" }
  );

  const { error: walletError } = await supabaseAdmin.from("credit_wallets").upsert(
    {
      user_id: userId,
      credits_available: 0,
      credits_total_purchased: 0,
    },
    { onConflict: "user_id" }
  );

  if (profileError || walletError) {
    await logServerEvent({
      eventName: "register_failed",
      eventCategory: "auth",
      eventLabel: profileError?.message ?? walletError?.message ?? "profile_setup",
      path: "/login",
    });
    redirect("/login?mode=register&error=register");
  }

  await logServerEvent({
    eventName: "register_success",
    eventCategory: "auth",
    eventLabel: therapistPlan ? `therapist:${therapistPlan}` : "therapist:free",
    path: "/login",
  });

  redirect("/login?registered=1");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const requestHeaders = await headers();
  const requestHost = getRequestHost(requestHeaders);
  const adminHostRequest = isAdminHost(requestHost);
  const emailDomain = email.includes("@") ? email.split("@")[1] : "unknown";

  if (!email || !email.includes("@")) {
    redirect(
      getScopedLoginUrl(
        { mode: "forgot", error: "email" },
        adminHostRequest,
        requestHost
      )
    );
  }

  const supabase = await createClient();
  const redirectTo = adminHostRequest
    ? getAdminAreaUrl("/reset-password", requestHost)
    : getPublicAreaUrl("/reset-password");

  await logServerEvent({
    eventName: "password_reset_requested",
    eventCategory: "auth",
    eventLabel: emailDomain,
    path: "/login",
  });

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    await logServerEvent({
      eventName: "password_reset_request_failed",
      eventCategory: "auth",
      eventLabel: error.message,
      path: "/login",
    });

    redirect(
      getScopedLoginUrl(
        { mode: "forgot", error: "recovery" },
        adminHostRequest,
        requestHost
      )
    );
  }

  redirect(
    getScopedLoginUrl(
      { mode: "forgot", sent: "1" },
      adminHostRequest,
      requestHost
    )
  );
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "").trim();
  const origin = String(formData.get("origin") ?? "login").trim();
  const safeNext =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/account";
  const invalidRedirect =
    origin === "account"
      ? "/account?error=invalid"
      : `/login?error=invalid${safeNext ? `&next=${encodeURIComponent(safeNext)}` : ""}`;
  const emailDomain = email.includes("@") ? email.split("@")[1] : "unknown";

  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const requestHost = getRequestHost(requestHeaders);
  const adminHostRequest = isAdminHost(requestHost);
  const ipAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    null;
  const userAgent = requestHeaders.get("user-agent");

  const security = await getRuntimeSecuritySettings();
  const supabaseAdmin = createAdminClient();
  await logServerEvent({
    eventName: "login_submit",
    eventCategory: "auth",
    eventLabel: emailDomain,
    path: "/login",
  });

  const windowStartIso = new Date(
    Date.now() - security.loginWindowMinutes * 60_000
  ).toISOString();
  const escalationWindowStartIso = new Date(
    Date.now() - security.escalationWindowMinutes * 60_000
  ).toISOString();

  let failedByEmail = 0;
  let failedByIp = 0;
  let failedByDevice = 0;
  let failedInEscalationWindow = 0;

  try {
    const emailQuery = supabaseAdmin
      .from("auth_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .eq("is_success", false)
      .gte("attempted_at", windowStartIso);

    const ipQuery = ipAddress
      ? supabaseAdmin
          .from("auth_login_attempts")
          .select("id", { count: "exact", head: true })
          .eq("ip_address", ipAddress)
          .eq("is_success", false)
          .gte("attempted_at", windowStartIso)
      : Promise.resolve({ count: 0, error: null } as const);

    const deviceQuery = userAgent
      ? supabaseAdmin
          .from("auth_login_attempts")
          .select("id", { count: "exact", head: true })
          .eq("user_agent", userAgent)
          .eq("is_success", false)
          .gte("attempted_at", windowStartIso)
      : Promise.resolve({ count: 0, error: null } as const);

    const escalationQuery = supabaseAdmin
      .from("auth_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .eq("is_success", false)
      .gte("attempted_at", escalationWindowStartIso);

    const [
      { count: emailCount, error: emailLimitError },
      { count: ipCount, error: ipLimitError },
      { count: deviceCount, error: deviceLimitError },
      { count: escalationCount, error: escalationError },
    ] = await Promise.all([
      emailQuery,
      ipQuery,
      deviceQuery,
      escalationQuery,
      supabaseAdmin
        .from("auth_login_attempts")
        .delete()
        .lt(
          "attempted_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        ),
    ]);

    if (!emailLimitError && typeof emailCount === "number") {
      failedByEmail = emailCount;
    }
    if (!ipLimitError && typeof ipCount === "number") {
      failedByIp = ipCount;
    }
    if (!deviceLimitError && typeof deviceCount === "number") {
      failedByDevice = deviceCount;
    }
    if (!escalationError && typeof escalationCount === "number") {
      failedInEscalationWindow = escalationCount;
    }
  } catch {
    failedByEmail = 0;
    failedByIp = 0;
    failedByDevice = 0;
    failedInEscalationWindow = 0;
  }

  const tooManyByEmail = failedByEmail >= security.loginAttemptLimit;
  const tooManyByIp = failedByIp >= security.ipAttemptLimit;
  const tooManyByDevice = failedByDevice >= security.ipAttemptLimit;
  const escalationTriggered =
    failedInEscalationWindow >= security.escalationThreshold;
  const blockMultiplier = escalationTriggered
    ? Math.max(
        2,
        Math.ceil(
          failedInEscalationWindow / Math.max(security.escalationThreshold, 1)
        )
      )
    : 1;
  const blockMinutes = security.loginWindowMinutes * blockMultiplier;
  const rateLimitRedirect =
    origin === "account"
      ? `/account?error=rate-limit&minutes=${blockMinutes}`
      : adminHostRequest
        ? getAdminLoginUrl(
            { error: "rate-limit", minutes: String(blockMinutes) },
            requestHost
          )
        : `/login?error=rate-limit&minutes=${blockMinutes}${safeNext ? `&next=${encodeURIComponent(safeNext)}` : ""}`;

  if (tooManyByEmail || tooManyByIp || tooManyByDevice || escalationTriggered) {
    const reason = tooManyByEmail
      ? "email_limit"
      : tooManyByIp
        ? "ip_limit"
        : tooManyByDevice
          ? "device_limit"
          : "escalation";

    await logSecurityAuditEvent({
      eventType: "login_blocked",
      severity: "warning",
      ipAddress,
      userAgent,
      details: {
        email,
        reason,
        failedByEmail,
        failedByIp,
        failedByDevice,
        failedInEscalationWindow,
        blockMinutes,
      },
    });

    await maybeSendSecurityAlert({
      email,
      ipAddress,
      userAgent,
      reason,
      blockedMinutes: blockMinutes,
    });

    redirect(rateLimitRedirect);
  }

  const supabase = await createClient();

  const signInResult = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  let signInError = signInResult.error;

  if (isUnconfirmedEmailError(signInError)) {
    const confirmed = await confirmApprovedAuthEmail({ email, supabaseAdmin });

    if (confirmed) {
      const retryResult = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      signInError = retryResult.error;
    }
  }

  const nowIso = new Date().toISOString();

  if (signInError) {
    try {
      await supabaseAdmin.from("auth_login_attempts").insert({
        email,
        ip_address: ipAddress,
        user_agent: userAgent,
        is_success: false,
        error_code: signInError.message,
        attempted_at: nowIso,
      });
    } catch {
      // noop when table does not exist yet
    }

    await logSecurityAuditEvent({
      eventType: "login_failed",
      severity: "warning",
      ipAddress,
      userAgent,
      details: {
        email,
        error: signInError.message,
      },
    });

    await logServerEvent({
      eventName: "login_failed",
      eventCategory: "auth",
      eventLabel: signInError.message,
      path: "/login",
    });

    if (isUnconfirmedEmailError(signInError)) {
      const unconfirmedRedirect =
        origin === "account"
          ? "/account?error=email-unconfirmed"
          : adminHostRequest
            ? getAdminLoginUrl({ error: "email-unconfirmed" }, requestHost)
            : `/login?error=email-unconfirmed${safeNext ? `&next=${encodeURIComponent(safeNext)}` : ""}`;

      redirect(unconfirmedRedirect);
    }

    redirect(invalidRedirect);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminProfile = user
    ? await supabaseAdmin
        .from("profiles")
        .select("role, profile_data")
        .eq("user_id", user.id)
        .maybeSingle<{ role?: string; profile_data?: Record<string, unknown> | null }>()
    : null;
  const isAdmin = isAdminRole(adminProfile?.data?.role);
  const approvalStatus = adminProfile?.data?.profile_data?.account_approval_status;
  const accountNeedsApproval =
    !isAdmin && (approvalStatus === "pending" || approvalStatus === "rejected");

  if (accountNeedsApproval) {
    await supabase.auth.signOut();
    redirect(
      origin === "account"
        ? "/account?error=approval-required"
        : `/login?error=approval-required${safeNext ? `&next=${encodeURIComponent(safeNext)}` : ""}`
    );
  }

  if (adminHostRequest && isAdmin && user) {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = factors?.totp?.find((factor) => factor.status === "verified");
    const isRequired = security.mfaPolicy === "required_admin";

    if (isRequired && !verified?.id) {
      await logServerEvent({
        eventName: "mfa_setup_required",
        eventCategory: "auth",
        eventLabel: "required_admin",
        path: "/login",
      });
      redirect(getAdminLoginUrl({ step: "mfa-setup" }, requestHost));
    }

    if (verified?.id) {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: verified.id });
      if (!challengeError && challenge?.id) {
        cookieStore.set(
          "mfa_factor_id",
          verified.id,
          getServerCookieOptions({
            httpOnly: true,
            maxAge: 5 * 60,
          }, requestHost)
        );
        cookieStore.set(
          "mfa_challenge_id",
          challenge.id,
          getServerCookieOptions({
            httpOnly: true,
            maxAge: 5 * 60,
          }, requestHost)
        );
        await logServerEvent({
          eventName: "mfa_challenge_started",
          eventCategory: "auth",
          eventLabel: "totp",
          path: "/login",
        });
      redirect(getAdminLoginUrl({ step: "mfa" }, requestHost));
      }
    }
  }

  try {
    await supabaseAdmin.from("auth_login_attempts").insert({
      email,
      ip_address: ipAddress,
      user_agent: userAgent,
      is_success: true,
      error_code: null,
      attempted_at: nowIso,
    });
  } catch {
    // noop when table does not exist yet
  }

  await logSecurityAuditEvent({
    eventType: "login_success",
    ipAddress,
    userAgent,
    details: {
      email,
    },
  });

  await logServerEvent({
    eventName: "login_success",
    eventCategory: "auth",
    eventLabel: emailDomain,
    path: "/login",
  });

  cookieStore.set(
    "admin_session_started_at",
    nowIso,
    getServerCookieOptions({ httpOnly: true }, requestHost)
  );

  if (adminHostRequest && isAdmin) {
    redirect(getAdminAreaUrl("/", requestHost));
  }

  redirect(safeNext || "/account");
}

export async function verifyMfa(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const requestHost = getRequestHost(requestHeaders);
  const factorId = cookieStore.get("mfa_factor_id")?.value;
  const challengeId = cookieStore.get("mfa_challenge_id")?.value;

  if (!code || !factorId || !challengeId) {
    await logServerEvent({
      eventName: "mfa_verify_invalid",
      eventCategory: "auth",
      eventLabel: "missing_code_or_challenge",
      path: "/login",
    });
    redirect("/login?step=mfa&error=invalid");
  }

  const supabase = await createClient();

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });

  if (verifyError) {
    await logServerEvent({
      eventName: "mfa_verify_failed",
      eventCategory: "auth",
      eventLabel: verifyError.message,
      path: "/login",
    });
    redirect(getAdminLoginUrl({ step: "mfa", error: "invalid" }, requestHost));
  }

  cookieStore.set(
    "mfa_factor_id",
    "",
    getServerCookieOptions({ httpOnly: true, maxAge: 0 }, requestHost)
  );
  cookieStore.set(
    "mfa_challenge_id",
    "",
    getServerCookieOptions({ httpOnly: true, maxAge: 0 }, requestHost)
  );

  await logServerEvent({
    eventName: "mfa_verify_success",
    eventCategory: "auth",
    eventLabel: "totp",
    path: "/login",
  });

  const nowIso = new Date().toISOString();
  cookieStore.set(
    "admin_session_started_at",
    nowIso,
    getServerCookieOptions({ httpOnly: true }, requestHost)
  );

  redirect(getAdminAreaUrl("/", requestHost));
}
