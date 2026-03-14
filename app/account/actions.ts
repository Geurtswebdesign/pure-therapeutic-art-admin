"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizeTherapistProfileData,
  type AppProfileData,
  type TherapistProfileData,
  type UserAccountType,
} from "@/lib/users/accountTypes";

function normalizeText(value?: string) {
  return value?.trim() ?? "";
}

export async function updateMyProfile(input: {
  displayName?: string;
  bio?: string;
  firstName?: string;
  lastName?: string;
  website?: string;
  avatarUrl?: string;
  accountType?: UserAccountType;
  therapistProfile?: Partial<TherapistProfileData> | null;
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
    .maybeSingle<{ profile_data?: AppProfileData | null }>();

  const nextProfileData = {
    ...(profileRow?.profile_data ?? {}),
    bio: normalizeText(input.bio),
    first_name: normalizeText(input.firstName),
    last_name: normalizeText(input.lastName),
    nickname: "",
    website: normalizeText(input.website),
    avatar_url: normalizeText(input.avatarUrl),
    account_type:
      input.accountType ??
      profileRow?.profile_data?.account_type ??
      "user",
    therapist_profile:
      input.therapistProfile === null
        ? null
        : input.therapistProfile
          ? normalizeTherapistProfileData(input.therapistProfile)
          : profileRow?.profile_data?.therapist_profile ?? null,
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: normalizeText(input.displayName) || null,
      profile_data: nextProfileData,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    throw new Error("Profiel opslaan mislukt");
  }

  revalidatePath("/account");
  revalidatePath("/therapeuten");
}
