import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPER_ADMIN_ID } from "@/lib/auth/constants";
import { getSupabaseCookieOptions } from "@/lib/site/urls";
import { isAdminRole } from "@/lib/users/accountTypes";

export async function getAdminUser() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const requestHost =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getSupabaseCookieOptions(requestHost),
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // 1️⃣ Auth user ophalen
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // 2️⃣ Profile ophalen
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, role, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  // 3️⃣ Admin check (DEZE regel is cruciaal)
  if (!isAdminRole(profile.role)) {
    return null;
  }

  // 4️⃣ Samengevoegde admin user
  return {
    id: user.id,
    email: user.email,
    role: profile.role,
    display_name: profile.display_name,
    isSuperAdmin: user.id === SUPER_ADMIN_ID,
  };
}
