import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function getAdminUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
  if (profile.role !== "admin") {
    return null;
  }

  // 4️⃣ Samengevoegde admin user
  return {
    id: user.id,
    email: user.email,
    role: profile.role,
    display_name: profile.display_name,
  };
}
