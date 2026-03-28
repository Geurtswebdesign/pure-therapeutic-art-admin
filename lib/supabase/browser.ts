import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseCookieOptions } from "@/lib/site/urls";

const browserHost =
  typeof window === "undefined" ? null : window.location.host;

export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookieOptions: getSupabaseCookieOptions(browserHost),
  }
);

export const supabase = supabaseBrowser;
