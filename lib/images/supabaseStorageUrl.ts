const PUBLIC_STORAGE_PATH_PREFIX = "/storage/v1/object/public/";
const LEGACY_MANAGED_SUPABASE_HOSTS = ["xyrcjaaodgrntcddmpba.supabase.co"];

type SupabaseStorageRemotePattern = {
  protocol: string;
  hostname: string;
  pathname: string;
  port?: string;
};

function getConfiguredSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isPublicSupabaseStoragePath(pathname: string) {
  return pathname.startsWith(PUBLIC_STORAGE_PATH_PREFIX);
}

function isManagedSupabaseHost(hostname: string) {
  return hostname.endsWith(".supabase.co");
}

export function normalizeSupabaseStorageUrl<
  T extends string | null | undefined,
>(value: T): T {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed as T;
  }

  const configuredSupabaseUrl = getConfiguredSupabaseUrl();
  if (!configuredSupabaseUrl) {
    return trimmed as T;
  }

  try {
    const sourceUrl = new URL(trimmed);
    if (!isPublicSupabaseStoragePath(sourceUrl.pathname)) {
      return trimmed as T;
    }

    const sameHost =
      sourceUrl.protocol === configuredSupabaseUrl.protocol &&
      sourceUrl.hostname === configuredSupabaseUrl.hostname &&
      sourceUrl.port === configuredSupabaseUrl.port;

    if (sameHost) {
      return trimmed as T;
    }

    if (!isManagedSupabaseHost(sourceUrl.hostname)) {
      return trimmed as T;
    }

    sourceUrl.protocol = configuredSupabaseUrl.protocol;
    sourceUrl.hostname = configuredSupabaseUrl.hostname;
    sourceUrl.port = configuredSupabaseUrl.port;
    return sourceUrl.toString() as T;
  } catch {
    return trimmed as T;
  }
}

export function getSupabaseStorageRemotePatterns() {
  const configuredSupabaseUrl = getConfiguredSupabaseUrl();
  const patterns: SupabaseStorageRemotePattern[] =
    LEGACY_MANAGED_SUPABASE_HOSTS.map((hostname) => ({
      protocol: "https",
      hostname,
      pathname: `${PUBLIC_STORAGE_PATH_PREFIX}**`,
    }));

  if (configuredSupabaseUrl) {
    patterns.push({
      protocol: configuredSupabaseUrl.protocol.replace(":", ""),
      hostname: configuredSupabaseUrl.hostname,
      pathname: `${PUBLIC_STORAGE_PATH_PREFIX}**`,
      ...(configuredSupabaseUrl.port
        ? { port: configuredSupabaseUrl.port }
        : {}),
    });
  }

  const seen = new Set<string>();
  return patterns.filter((pattern) => {
    const key = `${pattern.protocol}:${pattern.hostname}:${pattern.port ?? ""}:${pattern.pathname}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
