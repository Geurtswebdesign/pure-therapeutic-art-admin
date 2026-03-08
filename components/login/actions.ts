"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRuntimeSecuritySettings } from "@/lib/security/runtime";
import { logSecurityAuditEvent } from "@/lib/security/audit";
import { sendMail } from "@/lib/mail/sendMail";
import { logServerEvent } from "@/lib/analytics/server";

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

    throw new Error(
      `Te veel loginpogingen. Probeer opnieuw over ${blockMinutes} minuten.`
    );
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  const nowIso = new Date().toISOString();

  if (error) {
    try {
      await supabaseAdmin.from("auth_login_attempts").insert({
        email,
        ip_address: ipAddress,
        user_agent: userAgent,
        is_success: false,
        error_code: error.message,
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
        error: error.message,
      },
    });

    await logServerEvent({
      eventName: "login_failed",
      eventCategory: "auth",
      eventLabel: error.message,
      path: "/login",
    });

    redirect(invalidRedirect);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = user
    ? (
        await supabaseAdmin
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle<{ role?: string }>()
      ).data?.role === "admin"
    : false;

  if (isAdmin && user) {
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
      redirect("/login?step=mfa-setup");
    }

    if (verified?.id) {
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: verified.id });
      if (!challengeError && challenge?.id) {
        cookieStore.set("mfa_factor_id", verified.id, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 5 * 60,
        });
        cookieStore.set("mfa_challenge_id", challenge.id, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 5 * 60,
        });
        await logServerEvent({
          eventName: "mfa_challenge_started",
          eventCategory: "auth",
          eventLabel: "totp",
          path: "/login",
        });
        redirect("/login?step=mfa");
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

  cookieStore.set("admin_session_started_at", nowIso, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  if (isAdmin) {
    redirect("/admin");
  }

  redirect(safeNext || "/account");
}

export async function verifyMfa(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const cookieStore = await cookies();
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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    redirect("/login?step=mfa&error=invalid");
  }

  cookieStore.delete("mfa_factor_id");
  cookieStore.delete("mfa_challenge_id");

  await logServerEvent({
    eventName: "mfa_verify_success",
    eventCategory: "auth",
    eventLabel: "totp",
    path: "/login",
  });

  const nowIso = new Date().toISOString();
  cookieStore.set("admin_session_started_at", nowIso, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect("/admin");
}
