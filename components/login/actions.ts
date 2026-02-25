"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRuntimeSecuritySettings } from "@/lib/security/runtime";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const ipAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    null;
  const userAgent = requestHeaders.get("user-agent");

  const security = await getRuntimeSecuritySettings();
  const supabaseAdmin = createAdminClient();

  const windowStartIso = new Date(
    Date.now() - security.loginWindowMinutes * 60_000
  ).toISOString();

  let failedCount = 0;
  try {
    const [{ count, error: limitError }] = await Promise.all([
      supabaseAdmin
        .from("auth_login_attempts")
        .select("id", { count: "exact", head: true })
        .eq("email", email)
        .eq("is_success", false)
        .gte("attempted_at", windowStartIso),
      supabaseAdmin
        .from("auth_login_attempts")
        .delete()
        .lt(
          "attempted_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        ),
    ]);
    if (!limitError && typeof count === "number") {
      failedCount = count;
    }
  } catch {
    failedCount = 0;
  }

  if (failedCount >= security.loginAttemptLimit) {
    throw new Error(
      `Te veel loginpogingen. Probeer opnieuw over ${security.loginWindowMinutes} minuten.`
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
    throw new Error(error.message);
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

  cookieStore.set("admin_session_started_at", nowIso, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect("/admin");
}
