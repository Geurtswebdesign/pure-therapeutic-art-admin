import type { CookieOptionsWithName } from "@supabase/ssr";

const ADMIN_PREFIX = "/admin";

type HeaderReader = {
  get(name: string): string | null;
};

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function normalizePathname(value: string | null | undefined) {
  if (!value) return "/";
  if (value === "/") return value;
  return value.startsWith("/") ? value : `/${value}`;
}

function normalizeHost(value: string | null | undefined) {
  if (!value) return null;

  return value
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
}

function getHostFromOrigin(origin: string | null) {
  if (!origin) return null;

  try {
    return normalizeHost(new URL(origin).host);
  } catch {
    return null;
  }
}

export function getPublicSiteOrigin() {
  return normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);
}

export function getAdminSiteOrigin() {
  return normalizeOrigin(process.env.NEXT_PUBLIC_ADMIN_URL);
}

export function getPublicSiteHost() {
  return getHostFromOrigin(getPublicSiteOrigin());
}

export function getAdminSiteHost() {
  return getHostFromOrigin(getAdminSiteOrigin());
}

export function getRequestHost(headers: HeaderReader) {
  return normalizeHost(
    headers.get("x-forwarded-host") ?? headers.get("host")
  );
}

export function isAdminHost(host: string | null) {
  const adminHost = getAdminSiteHost();
  return Boolean(adminHost && host === adminHost);
}

export function isConfiguredPublicHost(host: string | null) {
  const publicHost = getPublicSiteHost();
  return Boolean(publicHost && host === publicHost);
}

export function isAdminInternalPath(pathname: string) {
  const normalized = normalizePathname(pathname);
  return (
    normalized === ADMIN_PREFIX || normalized.startsWith(`${ADMIN_PREFIX}/`)
  );
}

export function toAdminInternalPath(pathname: string) {
  const normalized = normalizePathname(pathname);
  if (isAdminInternalPath(normalized)) return normalized;
  return normalized === "/" ? ADMIN_PREFIX : `${ADMIN_PREFIX}${normalized}`;
}

export function toAdminExternalPath(pathname: string) {
  const normalized = normalizePathname(pathname);
  if (!isAdminInternalPath(normalized)) return normalized;

  const stripped = normalized.slice(ADMIN_PREFIX.length);
  return stripped || "/";
}

export function shouldBypassAdminRewrite(pathname: string) {
  const normalized = normalizePathname(pathname);

  return (
    normalized === "/login" ||
    normalized.startsWith("/login/") ||
    normalized === "/maintenance" ||
    normalized.startsWith("/maintenance/") ||
    normalized === "/unauthorized" ||
    normalized.startsWith("/unauthorized/") ||
    normalized === "/api" ||
    normalized.startsWith("/api/")
  );
}

export function getSharedCookieDomain() {
  const explicitDomain = normalizeHost(process.env.APP_COOKIE_DOMAIN);
  if (explicitDomain) {
    return explicitDomain.startsWith(".")
      ? explicitDomain
      : `.${explicitDomain}`;
  }

  const publicHost = getPublicSiteHost();
  const adminHost = getAdminSiteHost();
  if (!publicHost || !adminHost || publicHost === adminHost) {
    return null;
  }

  if (adminHost.endsWith(`.${publicHost}`)) {
    return `.${publicHost}`;
  }

  return null;
}

export function getSupabaseCookieOptions(): CookieOptionsWithName {
  const cookieDomain = getSharedCookieDomain();

  return {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    ...(cookieDomain ? { domain: cookieDomain } : null),
  };
}

export function getServerCookieOptions(
  overrides: CookieOptionsWithName = {}
): CookieOptionsWithName {
  return {
    ...getSupabaseCookieOptions(),
    ...overrides,
  };
}

export function getPublicAreaUrl(pathname = "/") {
  const normalized = normalizePathname(pathname);
  const publicOrigin = getPublicSiteOrigin();

  if (!publicOrigin) return normalized;
  return new URL(normalized, publicOrigin).toString();
}

export function getAdminAreaUrl(pathname = "/") {
  const normalized = normalizePathname(pathname);
  const externalPath = isAdminInternalPath(normalized)
    ? toAdminExternalPath(normalized)
    : normalized;
  const adminOrigin = getAdminSiteOrigin();

  if (!adminOrigin) {
    return toAdminInternalPath(externalPath);
  }

  return new URL(externalPath, adminOrigin).toString();
}

export function getAdminLoginUrl(params?: Record<string, string | null | undefined>) {
  const adminOrigin = getAdminSiteOrigin();
  const url = adminOrigin
    ? new URL("/login", adminOrigin)
    : new URL("/login", "http://local");

  for (const [key, value] of Object.entries(params ?? {})) {
    if (!value) continue;
    url.searchParams.set(key, value);
  }

  if (!adminOrigin) {
    return `${url.pathname}${url.search}`;
  }

  return url.toString();
}
