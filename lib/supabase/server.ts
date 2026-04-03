import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getRequestHost, getSupabaseCookieOptions } from "@/lib/site/urls";
import {
  getSupabaseAuthStorageKey,
  hasSupabaseAuthCookies as hasSupabaseAuthCookiesInStore,
  isRecoverableAuthError,
  isSupabaseAuthCookieName,
} from "@/lib/supabase/auth-cookies";

type ServerCookieStore = Awaited<ReturnType<typeof cookies>>;

function createConfiguredServerClient(
  cookieStore: ServerCookieStore,
  requestHost: string | null
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getSupabaseCookieOptions(requestHost),
      cookies: {
        encode: "tokens-only",
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
          }
        },
      },
    }
  );
}

export async function clearSupabaseAuthCookies() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const requestHost = getRequestHost(requestHeaders);
  const storageKey = getSupabaseAuthStorageKey();

  if (!storageKey) return;

  const cookieOptions = {
    ...getSupabaseCookieOptions(requestHost),
    maxAge: 0,
  };

  try {
    for (const cookie of cookieStore.getAll()) {
      if (!isSupabaseAuthCookieName(cookie.name, storageKey)) continue;
      cookieStore.set(cookie.name, "", cookieOptions);
    }
  } catch {
  }
}

async function hasStoredSupabaseAuthCookies() {
  const cookieStore = await cookies();
  return hasSupabaseAuthCookiesInStore(cookieStore.getAll());
}

export async function getUserOrNull(supabase: SupabaseClient) {
  if (!(await hasStoredSupabaseAuthCookies())) {
    return null;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      if (isRecoverableAuthError(error)) {
        await clearSupabaseAuthCookies();
        return null;
      }

      throw error;
    }

    return user;
  } catch (error) {
    if (isRecoverableAuthError(error)) {
      await clearSupabaseAuthCookies();
      return null;
    }

    throw error;
  }
}

export async function createClient() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const requestHost = getRequestHost(requestHeaders);

  return createConfiguredServerClient(cookieStore, requestHost);
}
