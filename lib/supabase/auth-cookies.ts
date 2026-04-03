type NamedCookie = {
  name: string;
  value?: string;
};

const RECOVERABLE_AUTH_ERROR_CODES = new Set([
  "refresh_token_not_found",
  "refresh_token_already_used",
  "session_not_found",
]);

export function getSupabaseAuthStorageKey() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    const hostname = new URL(supabaseUrl).hostname.split(".")[0];
    return `sb-${hostname}-auth-token`;
  } catch {
    return null;
  }
}

export function isSupabaseAuthCookieName(name: string, storageKey: string) {
  return (
    name === storageKey ||
    name.startsWith(`${storageKey}.`) ||
    name === `${storageKey}-code-verifier` ||
    name.startsWith(`${storageKey}-code-verifier.`) ||
    name === `${storageKey}-user` ||
    name.startsWith(`${storageKey}-user.`)
  );
}

export function hasSupabaseAuthCookies(cookies: NamedCookie[]) {
  const storageKey = getSupabaseAuthStorageKey();
  if (!storageKey) return false;

  return cookies.some(
    (cookie) =>
      Boolean(cookie.value) &&
      isSupabaseAuthCookieName(cookie.name, storageKey)
  );
}

export function isRecoverableAuthError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const authError = error as {
    code?: string;
    name?: string;
    message?: string;
    status?: number;
  };

  return (
    (typeof authError.code === "string" &&
      RECOVERABLE_AUTH_ERROR_CODES.has(authError.code)) ||
    authError.name === "AuthSessionMissingError" ||
    (authError.status === 400 &&
      typeof authError.message === "string" &&
      (authError.message.includes("Invalid Refresh Token") ||
        authError.message.includes("Auth session missing")))
  );
}
