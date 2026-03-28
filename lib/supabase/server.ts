import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseCookieOptions } from "@/lib/site/urls";

export async function createClient() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const requestHost =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getSupabaseCookieOptions(requestHost),
      cookies: {
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
