import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRuntimeSecuritySettings } from "@/lib/security/runtime";
import { isAdminRole } from "@/lib/users/accountTypes";
import "@/styles/backend.css";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import LogoutButton from "@/components/admin/LogoutButton";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const requestHeaders = await headers();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // 🔐 Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const startedAtRaw = cookieStore.get("admin_session_started_at")?.value;
  const startedAt = startedAtRaw ? Date.parse(startedAtRaw) : Number.NaN;

  const { data: invalidation } = await supabaseAdmin
    .from("auth_session_invalidations")
    .select("invalid_after")
    .eq("user_id", user.id)
    .maybeSingle<{ invalid_after?: string | null }>();

  if (invalidation?.invalid_after) {
    const invalidAfter = Date.parse(invalidation.invalid_after);
    if (!Number.isFinite(startedAt) || startedAt <= invalidAfter) {
      redirect("/login?reason=session-invalidated");
    }
  }

  // 🔐 Role check
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!isAdminRole(profile?.role)) {
    redirect("/unauthorized");
  }

  const security = await getRuntimeSecuritySettings();
  if (security.mfaPolicy === "required_admin") {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = factors?.totp?.find((factor) => factor.status === "verified");
    if (!verified?.id) {
      const currentPath = getRequestPath(requestHeaders);
      if (currentPath && !currentPath.startsWith("/admin/settings/security")) {
        redirect("/login?step=mfa-setup");
      }
    }
  }

  const primaryLanguage = await getPrimaryLanguage();

  return (
    <div className="admin-shell flex">
      <AdminSidebar language={primaryLanguage} />

      <div className="flex flex-col flex-1">
        <AdminTopbar actions={<LogoutButton />} />
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}

function getRequestPath(requestHeaders: Headers): string | null {
  const candidates = [
    "x-next-url",
    "next-url",
    "x-url",
    "x-original-url",
    "x-original-uri",
    "x-rewrite-url",
    "x-invoke-path",
    "x-matched-path",
    "x-forwarded-uri",
  ];

  for (const header of candidates) {
    const value = requestHeaders.get(header);
    if (!value) continue;
    const cleaned = value.split("?")[0];
    if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
      try {
        return new URL(cleaned).pathname;
      } catch {
        continue;
      }
    }
    if (cleaned.startsWith("/")) return cleaned;
  }

  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const urlHeader = requestHeaders.get("x-next-url");
  if (host && urlHeader) {
    try {
      return new URL(`${proto}://${host}${urlHeader}`).pathname;
    } catch {
      return null;
    }
  }

  return null;
}
