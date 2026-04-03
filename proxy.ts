import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  DEFAULT_SECURITY_SETTINGS,
  normalizeSecuritySettings,
  type SecuritySettings,
} from "@/lib/settings/security-types";
import {
  getAdminSiteOrigin,
  getRequestHost,
  isLocalDevelopmentHost,
  getServerCookieOptions,
  isAdminHost,
  isAdminInternalPath,
  shouldBypassAdminRewrite,
  toAdminExternalPath,
  toAdminInternalPath,
  getSupabaseCookieOptions,
} from "@/lib/site/urls";
import {
  getSupabaseAuthStorageKey,
  hasSupabaseAuthCookies,
  isRecoverableAuthError,
  isSupabaseAuthCookieName,
} from "@/lib/supabase/auth-cookies";

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

async function syncSupabaseSession(
  req: NextRequest,
  requestHost: string | null
) {
  const requestHeaders = new Headers(req.headers);
  const emptyResult = {
    requestHeaders,
    responseCookies: [] as Array<{
      name: string;
      value: string;
      options: ReturnType<typeof getSupabaseCookieOptions> & { maxAge?: number };
    }>,
  };
  const existingCookies = req.cookies.getAll();
  if (!hasSupabaseAuthCookies(existingCookies)) {
    return emptyResult;
  }

  let currentCookies = [...existingCookies];
  const responseCookies: Array<{
    name: string;
    value: string;
    options: ReturnType<typeof getSupabaseCookieOptions> & { maxAge?: number };
  }> = [];

  const upsertCookie = (name: string, value: string) => {
    currentCookies = currentCookies.filter((cookie) => cookie.name !== name);
    if (value) {
      currentCookies.push({ name, value });
    }
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getSupabaseCookieOptions(requestHost),
      cookies: {
        encode: "tokens-only",
        getAll() {
          return currentCookies;
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            upsertCookie(name, value);
            responseCookies.push({ name, value, options });
          }
        },
      },
    }
  );

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!user && error && isRecoverableAuthError(error)) {
      throw error;
    }
  } catch (error) {
    if (!isRecoverableAuthError(error)) {
      return emptyResult;
    }

    const storageKey = getSupabaseAuthStorageKey();
    if (!storageKey) return emptyResult;

    const cookieOptions = {
      ...getSupabaseCookieOptions(requestHost),
      maxAge: 0,
    };

    for (const cookie of existingCookies) {
      if (!isSupabaseAuthCookieName(cookie.name, storageKey)) continue;
      upsertCookie(cookie.name, "");
      responseCookies.push({
        name: cookie.name,
        value: "",
        options: cookieOptions,
      });
    }
  }

  const cookieHeader = currentCookies
    .filter((cookie) => cookie.value)
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  if (cookieHeader) {
    requestHeaders.set("cookie", cookieHeader);
  } else {
    requestHeaders.delete("cookie");
  }

  return { requestHeaders, responseCookies };
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const requestHost = getRequestHost(req.headers);
  const adminOrigin = getAdminSiteOrigin();
  const adminRequest = isAdminHost(requestHost);
  const sessionSync = await syncSupabaseSession(req, requestHost);
  const requestHeaders = sessionSync.requestHeaders;

  if (adminRequest && isAdminInternalPath(pathname)) {
    const target = new URL(toAdminExternalPath(pathname), req.url);
    target.search = req.nextUrl.search;
    return NextResponse.redirect(target);
  }

  if (
    !adminRequest &&
    adminOrigin &&
    isAdminInternalPath(pathname) &&
    !isLocalDevelopmentHost(requestHost)
  ) {
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

  let res = rewriteUrl
    ? NextResponse.rewrite(rewriteUrl, {
        request: {
          headers: requestHeaders,
        },
      })
    : NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

  if (effectivePathname.startsWith("/admin")) {
    if (!req.cookies.get("admin_session_started_at")?.value) {
      res.cookies.set(
        "admin_session_started_at",
        new Date().toISOString(),
        getServerCookieOptions({ httpOnly: true }, requestHost)
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
      res = NextResponse.redirect(new URL("/maintenance", req.url));
    }
  } else if (effectivePathname.startsWith("/maintenance")) {
    res = NextResponse.redirect(new URL("/", req.url));
  }

  for (const cookie of sessionSync.responseCookies) {
    res.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
