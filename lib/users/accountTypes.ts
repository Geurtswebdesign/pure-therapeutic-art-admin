import {
  filterAllowedTherapistSpecializations,
  filterAllowedTherapistTargetGroups,
} from "@/lib/users/therapistProfileOptions";

export type AccessRole = "admin" | "user";
export type UserAccountType = "user" | "client" | "therapist";
export type EffectiveAccountType = AccessRole | "client" | "therapist";

export type TherapistProfileData = {
  public_profile_enabled?: boolean | null;
  professional_title?: string | null;
  short_intro?: string | null;
  practice_name?: string | null;
  registration_number?: string | null;
  public_email?: string | null;
  phone?: string | null;
  city?: string | null;
  region?: string | null;
  location?: string | null;
  online_available?: boolean | null;
  in_person_available?: boolean | null;
  accepting_new_clients?: boolean | null;
  specializations?: string[] | null;
  target_groups?: string[] | null;
  languages?: string[] | null;
  methods?: string[] | null;
  years_experience?: number | null;
  intake_note?: string | null;
};

export type TherapistSubscriptionPreference = {
  plan?: "monthly" | "yearly" | null;
  pack_id?: string | null;
  pack_slug?: string | null;
  pack_name?: string | null;
  amount_cents?: number | null;
  currency?: string | null;
  selected_at?: string | null;
};

export type AppProfileData = {
  first_name?: string | null;
  last_name?: string | null;
  nickname?: string | null;
  preferred_language?: string | null;
  website?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  profile_image?: string | null;
  account_type?: UserAccountType | null;
  therapist_profile?: TherapistProfileData | null;
  therapist_subscription_preference?: TherapistSubscriptionPreference | null;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
}

export function normalizeAccessRole(value: unknown): AccessRole {
  return value === "admin" ? "admin" : "user";
}

export function normalizeUserAccountType(value: unknown): UserAccountType {
  if (value === "client" || value === "therapist") {
    return value;
  }

  return "user";
}

export function isAdminRole(value: unknown) {
  return normalizeAccessRole(value) === "admin";
}

export function getProfileAccountType(
  profileData?: AppProfileData | Record<string, unknown> | null
): UserAccountType {
  const source = asObject(profileData);
  return normalizeUserAccountType(source?.account_type);
}

export function getEffectiveAccountType(
  role: unknown,
  profileData?: AppProfileData | Record<string, unknown> | null
): EffectiveAccountType {
  if (isAdminRole(role)) {
    return "admin";
  }

  return getProfileAccountType(profileData);
}

export function parseDelimitedList(input: string) {
  return input
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatDelimitedList(values?: string[] | null) {
  return (values ?? []).filter(Boolean).join(", ");
}

export function parseSpecializations(input: string) {
  return parseDelimitedList(input);
}

export function formatSpecializations(values?: string[] | null) {
  return formatDelimitedList(values);
}

export function getTherapistProfileData(
  profileData?: AppProfileData | Record<string, unknown> | null
): TherapistProfileData {
  const source = asObject(profileData);
  const therapist = asObject(source?.therapist_profile);

  return {
    public_profile_enabled: asBoolean(therapist?.public_profile_enabled),
    professional_title: asString(therapist?.professional_title) || null,
    short_intro: asString(therapist?.short_intro) || null,
    practice_name: asString(therapist?.practice_name) || null,
    registration_number: asString(therapist?.registration_number) || null,
    public_email: asString(therapist?.public_email) || null,
    phone: asString(therapist?.phone) || null,
    city: asString(therapist?.city) || null,
    region: asString(therapist?.region) || null,
    location: asString(therapist?.location) || null,
    online_available: asBoolean(therapist?.online_available),
    in_person_available: asBoolean(therapist?.in_person_available),
    accepting_new_clients: asBoolean(therapist?.accepting_new_clients),
    specializations: filterAllowedTherapistSpecializations(
      asStringArray(therapist?.specializations)
    ),
    target_groups: filterAllowedTherapistTargetGroups(
      asStringArray(therapist?.target_groups)
    ),
    languages: asStringArray(therapist?.languages),
    methods: asStringArray(therapist?.methods),
    years_experience: asNumber(therapist?.years_experience),
    intake_note: asString(therapist?.intake_note) || null,
  };
}

export function normalizeTherapistProfileData(
  input?: Partial<TherapistProfileData> | null
): TherapistProfileData {
  return {
    public_profile_enabled: Boolean(input?.public_profile_enabled),
    professional_title: asString(input?.professional_title) || null,
    short_intro: asString(input?.short_intro) || null,
    practice_name: asString(input?.practice_name) || null,
    registration_number: asString(input?.registration_number) || null,
    public_email: asString(input?.public_email) || null,
    phone: asString(input?.phone) || null,
    city: asString(input?.city) || null,
    region: asString(input?.region) || null,
    location: asString(input?.location) || null,
    specializations: filterAllowedTherapistSpecializations(
      (input?.specializations ?? [])
        .map((value) => asString(value))
        .filter(Boolean)
    ),
    target_groups: filterAllowedTherapistTargetGroups(
      (input?.target_groups ?? [])
        .map((value) => asString(value))
        .filter(Boolean)
    ),
    languages: (input?.languages ?? [])
      .map((value) => asString(value))
      .filter(Boolean),
    methods: (input?.methods ?? [])
      .map((value) => asString(value))
      .filter(Boolean),
    online_available: Boolean(input?.online_available),
    in_person_available: Boolean(input?.in_person_available),
    accepting_new_clients: Boolean(input?.accepting_new_clients),
    years_experience: asNumber(input?.years_experience),
    intake_note: asString(input?.intake_note) || null,
  };
}
