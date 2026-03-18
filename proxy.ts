import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_SECURITY_SETTINGS,
  normalizeSecuritySettings,
  type SecuritySettings,
} from "@/lib/settings/security-types";
import {
  getAdminSiteOrigin,
  getRequestHost,
  getServerCookieOptions,
  isAdminHost,
  isAdminInternalPath,
  shouldBypassAdminRewrite,
  toAdminExternalPath,
  toAdminInternalPath,
} from "@/lib/site/urls";

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

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const requestHost = getRequestHost(req.headers);
  const adminOrigin = getAdminSiteOrigin();
  const adminRequest = isAdminHost(requestHost);

  if (adminRequest && isAdminInternalPath(pathname)) {
    const target = new URL(toAdminExternalPath(pathname), req.url);
    target.search = req.nextUrl.search;
    return NextResponse.redirect(target);
  }

  if (!adminRequest && adminOrigin && isAdminInternalPath(pathname)) {
    const target = new URL(toAdminExternalPath(pathname), adminOrigin);
    target.search = req.nextUrl.search;
    return NextResponse.redirect(target);
  }

  const effectivePathname =
    adminRequest && !shouldBypassAdminRewrite(pathname)
      ? toAdminInternalPath(pathname)
      : pathname;
  const rewriteUrl =
    effectivePathname !== pathname
      ? (() => {
          const url = new URL(req.url);
          url.pathname = effectivePathname;
          url.search = req.nextUrl.search;
          return url;
        })()
      : null;

  const res = rewriteUrl
    ? NextResponse.rewrite(rewriteUrl, {
        request: {
          headers: req.headers,
        },
      })
    : NextResponse.next({
        request: {
          headers: req.headers,
        },
      });

  if (effectivePathname.startsWith("/admin")) {
    if (!req.cookies.get("admin_session_started_at")?.value) {
      res.cookies.set(
        "admin_session_started_at",
        new Date().toISOString(),
        getServerCookieOptions({ httpOnly: true })
      );
    }
  }

  const security = await getSecuritySettingsFromDb();
  if (security.maintenanceMode) {
    const allowedDuringMaintenance =
      effectivePathname.startsWith("/maintenance") ||
      effectivePathname.startsWith("/admin") ||
      effectivePathname.startsWith("/login") ||
      effectivePathname.startsWith("/api");

    if (!allowedDuringMaintenance) {
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }
  } else if (effectivePathname.startsWith("/maintenance")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
