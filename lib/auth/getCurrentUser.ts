import { createClient, getUserOrNull } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  return getUserOrNull(supabase);
}
