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

export function isLocalDevelopmentHost(host: string | null | undefined) {
  const normalized = normalizeHost(host);
  if (!normalized) return false;

  if (
    normalized === "localhost" ||
    normalized === "::1" ||
    normalized === "[::1]" ||
    normalized.endsWith(".local")
  ) {
    return true;
  }

  if (/^127(?:\.\d{1,3}){3}$/.test(normalized)) {
    return true;
  }

  if (/^10(?:\.\d{1,3}){3}$/.test(normalized)) {
    return true;
  }

  if (/^192\.168(?:\.\d{1,3}){2}$/.test(normalized)) {
    return true;
  }

  const private172Match = normalized.match(/^172\.(\d{1,3})(?:\.\d{1,3}){2}$/);
  if (!private172Match) {
    return false;
  }

  const secondOctet = Number(private172Match[1]);
  return secondOctet >= 16 && secondOctet <= 31;
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

export function getSharedCookieDomain(requestHost?: string | null) {
  if (isLocalDevelopmentHost(requestHost)) {
    return null;
  }

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

export function getSupabaseCookieOptions(
  requestHost?: string | null
): CookieOptionsWithName {
  const cookieDomain = getSharedCookieDomain(requestHost);

  return {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    ...(cookieDomain ? { domain: cookieDomain } : null),
  };
}

export function getServerCookieOptions(
  overrides: CookieOptionsWithName = {},
  requestHost?: string | null
): CookieOptionsWithName {
  return {
    ...getSupabaseCookieOptions(requestHost),
    ...overrides,
  };
}

export function getPublicAreaUrl(pathname = "/") {
  const normalized = normalizePathname(pathname);
  const publicOrigin = getPublicSiteOrigin();

  if (!publicOrigin) return normalized;
  return new URL(normalized, publicOrigin).toString();
}

export function getAdminAreaUrl(pathname = "/", requestHost?: string | null) {
  const normalized = normalizePathname(pathname);
  const externalPath = isAdminInternalPath(normalized)
    ? toAdminExternalPath(normalized)
    : normalized;
  const adminOrigin = getAdminSiteOrigin();

  if (!adminOrigin || isLocalDevelopmentHost(requestHost)) {
    return toAdminInternalPath(externalPath);
  }

  return new URL(externalPath, adminOrigin).toString();
}

export function getAdminLoginUrl(
  params?: Record<string, string | null | undefined>,
  requestHost?: string | null
) {
  const adminOrigin = getAdminSiteOrigin();
  const useInternalPath = !adminOrigin || isLocalDevelopmentHost(requestHost);
  const url = useInternalPath
    ? new URL("/login", "http://local")
    : new URL("/login", adminOrigin);

  for (const [key, value] of Object.entries(params ?? {})) {
    if (!value) continue;
    url.searchParams.set(key, value);
  }

  if (useInternalPath) {
    return `${url.pathname}${url.search}`;
  }

  return url.toString();
}
