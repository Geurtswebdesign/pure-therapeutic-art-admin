import { SUPER_ADMIN_ID } from "@/lib/auth/constants";
import { createClient, getUserOrNull } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/users/accountTypes";

export async function getAdminUser() {
  const supabase = await createClient();
  const user = await getUserOrNull(supabase);

  if (!user) {
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
