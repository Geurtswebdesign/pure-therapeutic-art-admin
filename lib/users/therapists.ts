import { createAdminClient } from "@/lib/supabase/admin";
import { getTherapistProfileData, type AppProfileData } from "@/lib/users/accountTypes";
import { mergeTherapistOptions, THERAPIST_PROFILE_OPTION_SETS } from "@/lib/users/therapistProfileOptions";
import {
  isTimedEntitlementActive,
  THERAPIST_DIRECTORY_ENTITLEMENT_KEY,
} from "@/lib/users/entitlements";

export type PublicTherapist = {
  userId: string;
  displayName: string;
  avatarUrl: string;
  website: string;
  bio: string;
  professionalTitle: string;
  shortIntro: string;
  practiceName: string;
  registrationNumber: string;
  publicEmail: string;
  phone: string;
  city: string;
  region: string;
  location: string;
  onlineAvailable: boolean;
  inPersonAvailable: boolean;
  acceptingNewClients: boolean;
  specializations: string[];
  targetGroups: string[];
  languages: string[];
  methods: string[];
  yearsExperience: number | null;
  intakeNote: string;
};

export type TherapistDirectoryFilters = {
  q?: string;
  city?: string;
  specialization?: string;
  targetGroup?: string;
  language?: string;
  method?: string;
  onlineOnly?: boolean;
  inPersonOnly?: boolean;
  acceptingOnly?: boolean;
};

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  profile_data?: AppProfileData | null;
};

type TherapistEntitlementRow = {
  user_id: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
};

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function includesMatch(haystack: string[], needle: string) {
  const safeNeedle = normalizeText(needle);
  if (!safeNeedle) return true;
  return haystack.some((value) => normalizeText(value).includes(safeNeedle));
}

function toPublicTherapist(row: ProfileRow): PublicTherapist | null {
  const profileData = row.profile_data ?? null;
  if (profileData?.account_type !== "therapist") {
    return null;
  }

  const therapist = getTherapistProfileData(profileData);
  if (!therapist.public_profile_enabled) {
    return null;
  }

  const firstName = profileData?.first_name?.trim() ?? "";
  const lastName = profileData?.last_name?.trim() ?? "";
  const displayName =
    row.display_name?.trim() ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    "Therapeut";

  return {
    userId: row.user_id,
    displayName,
    avatarUrl:
      profileData?.avatar_url?.trim() ||
      profileData?.profile_image?.trim() ||
      "",
    website: profileData?.website?.trim() || "",
    bio: profileData?.bio?.trim() || "",
    professionalTitle: therapist.professional_title?.trim() || "",
    shortIntro: therapist.short_intro?.trim() || "",
    practiceName: therapist.practice_name?.trim() || "",
    registrationNumber: therapist.registration_number?.trim() || "",
    publicEmail: therapist.public_email?.trim() || "",
    phone: therapist.phone?.trim() || "",
    city: therapist.city?.trim() || "",
    region: therapist.region?.trim() || "",
    location: therapist.location?.trim() || "",
    onlineAvailable: Boolean(therapist.online_available),
    inPersonAvailable: Boolean(therapist.in_person_available),
    acceptingNewClients: Boolean(therapist.accepting_new_clients),
    specializations: therapist.specializations ?? [],
    targetGroups: therapist.target_groups ?? [],
    languages: therapist.languages ?? [],
    methods: therapist.methods ?? [],
    yearsExperience: therapist.years_experience ?? null,
    intakeNote: therapist.intake_note?.trim() || "",
  };
}

function matchesTherapist(
  therapist: PublicTherapist,
  filters: TherapistDirectoryFilters
) {
  const q = filters.q?.trim() ?? "";
  const city = filters.city?.trim() ?? "";
  const specialization = filters.specialization?.trim() ?? "";
  const targetGroup = filters.targetGroup?.trim() ?? "";
  const language = filters.language?.trim() ?? "";
  const method = filters.method?.trim() ?? "";

  if (filters.onlineOnly && !therapist.onlineAvailable) {
    return false;
  }

  if (filters.inPersonOnly && !therapist.inPersonAvailable) {
    return false;
  }

  if (filters.acceptingOnly && !therapist.acceptingNewClients) {
    return false;
  }

  if (city && normalizeText(therapist.city) !== normalizeText(city)) {
    return false;
  }

  if (specialization && !includesMatch(therapist.specializations, specialization)) {
    return false;
  }

  if (targetGroup && !includesMatch(therapist.targetGroups, targetGroup)) {
    return false;
  }

  if (language && !includesMatch(therapist.languages, language)) {
    return false;
  }

  if (method && !includesMatch(therapist.methods, method)) {
    return false;
  }

  if (!q) {
    return true;
  }

  return includesMatch(
    [
      therapist.displayName,
      therapist.professionalTitle,
      therapist.practiceName,
      therapist.shortIntro,
      therapist.city,
      therapist.region,
      therapist.location,
      ...therapist.specializations,
      ...therapist.targetGroups,
      ...therapist.languages,
      ...therapist.methods,
    ],
    q
  );
}

export async function getPublicTherapistDirectoryData(
  filters: TherapistDirectoryFilters = {}
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, profile_data")
    .eq("role", "user")
    .returns<ProfileRow[]>();

  if (error) {
    throw new Error("Therapeuten laden mislukt");
  }

  const therapistUserIds = (data ?? [])
    .filter((row) => row.profile_data?.account_type === "therapist")
    .map((row) => row.user_id);

  const { data: entitlements, error: entitlementError } = therapistUserIds.length
    ? await supabase
        .from("user_entitlements")
        .select("user_id, starts_at, ends_at, is_active")
        .eq("entitlement_key", THERAPIST_DIRECTORY_ENTITLEMENT_KEY)
        .eq("is_active", true)
        .in("user_id", therapistUserIds)
        .returns<TherapistEntitlementRow[]>()
    : { data: [] as TherapistEntitlementRow[], error: null };

  if (entitlementError) {
    throw new Error("Therapeutenabonnementen laden mislukt");
  }

  const nowIso = new Date().toISOString();
  const activeTherapistIds = new Set(
    (entitlements ?? [])
      .filter((item) => isTimedEntitlementActive(item, nowIso))
      .map((item) => item.user_id)
  );

  const allTherapists = (data ?? [])
    .map(toPublicTherapist)
    .filter((item): item is PublicTherapist => Boolean(item))
    .filter((item) => activeTherapistIds.has(item.userId))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "nl"));

  const therapists = allTherapists.filter((item) => matchesTherapist(item, filters));

  return {
    therapists,
    cities: Array.from(
      new Set(allTherapists.map((item) => item.city).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "nl")),
    specializations: THERAPIST_PROFILE_OPTION_SETS.specializations,
    targetGroups: THERAPIST_PROFILE_OPTION_SETS.targetGroups,
    languages: mergeTherapistOptions(
      THERAPIST_PROFILE_OPTION_SETS.languages,
      Array.from(new Set(allTherapists.flatMap((item) => item.languages))).sort(
        (a, b) => a.localeCompare(b, "nl")
      )
    ),
    methods: mergeTherapistOptions(
      THERAPIST_PROFILE_OPTION_SETS.methods,
      Array.from(new Set(allTherapists.flatMap((item) => item.methods))).sort(
        (a, b) => a.localeCompare(b, "nl")
      )
    ),
  };
}
