import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseCookieOptions } from "@/lib/site/urls";

export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookieOptions: getSupabaseCookieOptions(),
  }
);

export const supabase = supabaseBrowser;
