import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_SECURITY_SETTINGS,
  normalizeSecuritySettings,
  type SecuritySettings,
} from "@/lib/settings/security-types";

const FETCH_TIMEOUT_MS = 2500;
const SECURITY_SETTINGS_TTL_MS = 30_000;
type CacheEntry<T> = { value: T; expiresAt: number };

const securitySettingsCache: { entry: CacheEntry<SecuritySettings> | null } = {
  entry: null,
};

function readCache<T>(entry: CacheEntry<T> | undefined | null): T | null {
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) return null;
  return entry.value;
}

function writeCache<T>(value: T, ttlMs: number): CacheEntry<T> {
  return { value, expiresAt: Date.now() + ttlMs };
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function getSecuritySettingsFromDb(): Promise<SecuritySettings> {
  const cached = readCache(securitySettingsCache.entry);
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) return DEFAULT_SECURITY_SETTINGS;

  try {
    const response = await fetchWithTimeout(
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
    const settings = normalizeSecuritySettings({
      loginAttemptLimit: obj.loginAttemptLimit as number | undefined,
      loginWindowMinutes: obj.loginWindowMinutes as number | undefined,
      adminSessionTimeoutMinutes: obj.adminSessionTimeoutMinutes as number | undefined,
      maintenanceMode: obj.maintenanceMode as boolean | undefined,
    });
    securitySettingsCache.entry = writeCache(
      settings,
      SECURITY_SETTINGS_TTL_MS
    );
    return settings;
  } catch {
    return DEFAULT_SECURITY_SETTINGS;
  }
}

function clearAuthCookies(req: NextRequest, res: NextResponse) {
  res.cookies.delete("admin_session_started_at");
  for (const cookie of req.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      res.cookies.delete(cookie.name);
    }
  }
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  if (pathname.startsWith("/admin")) {
    if (!req.cookies.get("admin_session_started_at")?.value) {
      res.cookies.set("admin_session_started_at", new Date().toISOString(), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    const security = await getSecuritySettingsFromDb();
    const startedAtRaw = req.cookies.get("admin_session_started_at")?.value;
    if (startedAtRaw) {
      const startedAt = Date.parse(startedAtRaw);
      const timeoutMs = security.adminSessionTimeoutMinutes * 60_000;
      if (Number.isFinite(startedAt) && Date.now() - startedAt > timeoutMs) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("reason", "session-timeout");
        const timeoutRes = NextResponse.redirect(loginUrl);
        clearAuthCookies(req, timeoutRes);
        return timeoutRes;
      }
    }

  }

  const security = await getSecuritySettingsFromDb();
  if (security.maintenanceMode) {
    const allowedDuringMaintenance =
      pathname.startsWith("/maintenance") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/api");

    if (!allowedDuringMaintenance) {
      return NextResponse.redirect(new URL("/maintenance", req.url));
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
