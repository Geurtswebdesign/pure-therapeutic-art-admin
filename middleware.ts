import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  DEFAULT_SECURITY_SETTINGS,
  normalizeSecuritySettings,
  type SecuritySettings,
} from "@/lib/settings/security-types";

async function getSecuritySettingsFromDb(): Promise<SecuritySettings> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) return DEFAULT_SECURITY_SETTINGS;

  try {
    const response = await fetch(
      `${url}/rest/v1/app_settings?scope=eq.global&scope_id=is.null&key=eq.security&select=value&limit=1`,
      {
        headers: {
          apikey: serviceRole,
          Authorization: `Bearer ${serviceRole}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) return DEFAULT_SECURITY_SETTINGS;
    const rows = (await response.json()) as Array<{ value?: unknown }>;
    const value = rows?.[0]?.value;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return DEFAULT_SECURITY_SETTINGS;
    }

    const obj = value as Record<string, unknown>;
    return normalizeSecuritySettings({
      loginAttemptLimit: obj.loginAttemptLimit as number | undefined,
      loginWindowMinutes: obj.loginWindowMinutes as number | undefined,
      adminSessionTimeoutMinutes: obj.adminSessionTimeoutMinutes as number | undefined,
      maintenanceMode: obj.maintenanceMode as boolean | undefined,
    });
  } catch {
    return DEFAULT_SECURITY_SETTINGS;
  }
}

async function isAdminByUserId(userId: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) return false;

  try {
    const response = await fetch(
      `${url}/rest/v1/profiles?select=role&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
      {
        headers: {
          apikey: serviceRole,
          Authorization: `Bearer ${serviceRole}`,
        },
        cache: "no-store",
      }
    );
    if (!response.ok) return false;
    const rows = (await response.json()) as Array<{ role?: string }>;
    return rows?.[0]?.role === "admin";
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const security = await getSecuritySettingsFromDb();
  const pathname = req.nextUrl.pathname;

  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            res.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname.startsWith("/admin")) {
    const startedAtRaw = req.cookies.get("admin_session_started_at")?.value;
    if (startedAtRaw) {
      const startedAt = Date.parse(startedAtRaw);
      const timeoutMs = security.adminSessionTimeoutMinutes * 60_000;
      if (Number.isFinite(startedAt) && Date.now() - startedAt > timeoutMs) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("reason", "session-timeout");
        const timeoutRes = NextResponse.redirect(loginUrl);
        timeoutRes.cookies.delete("admin_session_started_at");
        return timeoutRes;
      }
    }

    if (user) {
      res.cookies.set("admin_session_started_at", new Date().toISOString(), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }
  }

  if (security.maintenanceMode) {
    const allowedDuringMaintenance =
      pathname.startsWith("/maintenance") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/api");

    if (!allowedDuringMaintenance) {
      const isAdmin = user ? await isAdminByUserId(user.id) : false;
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/maintenance", req.url));
      }
    }
  } else if (pathname.startsWith("/maintenance")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
