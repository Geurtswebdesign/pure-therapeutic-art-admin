import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseCookieOptions } from "@/lib/site/urls";

const browserHost =
  typeof window === "undefined" ? null : window.location.host;

function getBrowserCookies() {
  if (typeof document === "undefined" || !document.cookie) {
    return [];
  }

  return document.cookie
    .split(/;\s*/)
    .filter(Boolean)
    .map((entry) => {
      const separatorIndex = entry.indexOf("=");
      const name = separatorIndex >= 0 ? entry.slice(0, separatorIndex) : entry;
      const value = separatorIndex >= 0 ? entry.slice(separatorIndex + 1) : "";
      return { name, value };
    });
}

function setBrowserCookies(
  cookiesToSet: Array<{
    name: string;
    value: string;
    options: {
      domain?: string;
      expires?: Date;
      maxAge?: number;
      path?: string;
      sameSite?: boolean | "lax" | "strict" | "none";
      secure?: boolean;
    };
  }>
) {
  if (typeof document === "undefined") {
    return;
  }

  for (const { name, value, options } of cookiesToSet) {
    const parts = [`${name}=${value}`];
    parts.push(`Path=${options.path ?? "/"}`);

    if (typeof options.maxAge === "number") {
      parts.push(`Max-Age=${options.maxAge}`);
    }

    if (options.domain) {
      parts.push(`Domain=${options.domain}`);
    }

    if (options.expires instanceof Date) {
      parts.push(`Expires=${options.expires.toUTCString()}`);
    }

    if (options.sameSite) {
      const sameSite =
        typeof options.sameSite === "string"
          ? options.sameSite
          : options.sameSite === true
            ? "strict"
            : undefined;

      if (sameSite) {
        parts.push(`SameSite=${sameSite}`);
      }
    }

    if (options.secure) {
      parts.push("Secure");
    }

    document.cookie = parts.join("; ");
  }
}

export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookieOptions: getSupabaseCookieOptions(browserHost),
    cookies: {
      encode: "tokens-only",
      getAll() {
        return getBrowserCookies();
      },
      setAll(cookiesToSet) {
        setBrowserCookies(cookiesToSet);
      },
    },
  }
);

export const supabase = supabaseBrowser;
