"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateMyProfile(input: {
  displayName?: string;
  bio?: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Niet ingelogd");
  }

  const supabase = createAdminClient();

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("profile_data")
    .eq("user_id", user.id)
    .maybeSingle<{ profile_data?: { bio?: string | null } | null }>();

  const nextProfileData = {
    ...(profileRow?.profile_data ?? {}),
    bio: input.bio ?? "",
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName ?? null,
      profile_data: nextProfileData,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Profiel opslaan mislukt");
  }

  revalidatePath("/account");
}

