import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/mail/service";
import { getPublicAreaUrl } from "@/lib/site/urls";
import {
  getProfileAccountType,
  getTherapistProfileData,
  type AppProfileData,
} from "@/lib/users/accountTypes";
import {
  isTimedEntitlementActive,
  THERAPIST_DIRECTORY_ENTITLEMENT_KEY,
} from "@/lib/users/entitlements";

const LEGACY_CUTOFF_ISO =
  process.env.THERAPIST_PROFILE_REMINDER_LEGACY_CUTOFF_ISO ||
  "2026-06-26T00:00:00.000Z";

type ReminderKey = "legacy" | "day_7" | "day_21";

type EntitlementRow = {
  id: string;
  user_id: string;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean | null;
  source?: string | null;
  metadata?: Record<string, unknown> | null;
};

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  profile_data?: AppProfileData | null;
};

type CreditPackRow = {
  id: string;
  price_cents: number | null;
};

type EmailLogRow = {
  metadata?: Record<string, unknown> | null;
};

export type TherapistProfileReminderResult = {
  checked: number;
  eligible: number;
  skippedReady: number;
  skippedAlreadySent: number;
  skippedMissingEmail: number;
  sent: number;
  failed: number;
  dryRun: boolean;
  details: Array<{
    userId: string;
    entitlementId: string;
    reminderKey: ReminderKey;
    email?: string | null;
    status:
      | "would_send"
      | "sent"
      | "failed"
      | "ready"
      | "already_sent"
      | "missing_email"
      | "not_due";
    issues?: string[];
    error?: string;
  }>;
};

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function daysSince(startsAt: string, now: Date) {
  const startTime = new Date(startsAt).getTime();
  if (!Number.isFinite(startTime)) return 0;
  return Math.floor((now.getTime() - startTime) / 86_400_000);
}

function getReminderKey(row: EntitlementRow, now: Date): ReminderKey | null {
  if (row.starts_at < LEGACY_CUTOFF_ISO) {
    return "legacy";
  }

  const ageDays = daysSince(row.starts_at, now);
  if (ageDays >= 21) return "day_21";
  if (ageDays >= 7) return "day_7";
  return null;
}

function getReminderLabel(key: ReminderKey) {
  if (key === "day_7") return "7 dagen";
  if (key === "day_21") return "21 dagen";
  return "welkomstherinnering";
}

function getPackId(row: EntitlementRow) {
  return asString(row.metadata?.pack_id) || null;
}

function isPaidEntitlement(row: EntitlementRow, packPricesById: Map<string, number>) {
  const metadataAmount = asNumber(row.metadata?.amount_cents);
  if (metadataAmount !== null) {
    return metadataAmount > 0;
  }

  const packId = getPackId(row);
  if (!packId) return false;
  return (packPricesById.get(packId) ?? 0) > 0;
}

function hasMeaningfulTherapistProfile(profile: ProfileRow | undefined) {
  const profileData = profile?.profile_data ?? null;
  const therapist = getTherapistProfileData(profileData);
  const issues: string[] = [];

  if (getProfileAccountType(profileData) !== "therapist") {
    issues.push("account_type_is_not_therapist");
  }

  if (!therapist.public_profile_enabled) {
    issues.push("public_profile_not_enabled");
  }

  const displayName =
    profile?.display_name?.trim() ||
    [profileData?.first_name?.trim(), profileData?.last_name?.trim()]
      .filter(Boolean)
      .join(" ");
  if (!displayName) {
    issues.push("display_name_missing");
  }

  if (!therapist.short_intro?.trim() && !profileData?.bio?.trim()) {
    issues.push("intro_missing");
  }

  if (!therapist.city?.trim() && !therapist.location?.trim()) {
    issues.push("location_missing");
  }

  if (
    !therapist.public_email?.trim() &&
    !therapist.phone?.trim() &&
    !profileData?.website?.trim()
  ) {
    issues.push("contact_missing");
  }

  return {
    ready: issues.length === 0,
    issues,
  };
}

function selectReminderCandidates(rows: EntitlementRow[], now: Date) {
  const sorted = [...rows].sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const candidatesByUserId = new Map<
    string,
    { row: EntitlementRow; reminderKey: ReminderKey }
  >();

  for (const row of sorted) {
    const reminderKey = getReminderKey(row, now);
    if (!reminderKey || candidatesByUserId.has(row.user_id)) {
      continue;
    }

    candidatesByUserId.set(row.user_id, { row, reminderKey });
  }

  return Array.from(candidatesByUserId.values());
}

async function getSentReminderKeys(userIds: string[]) {
  if (!userIds.length) return new Set<string>();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("email_logs")
    .select("metadata")
    .eq("status", "sent")
    .eq("metadata->>reminder_kind", "therapist_profile_incomplete")
    .in("metadata->>user_id", userIds)
    .returns<EmailLogRow[]>();

  if (error) {
    throw new Error(`Reminder logs ophalen mislukt: ${error.message}`);
  }

  return new Set(
    (data ?? [])
      .map((row) => {
        const userId = asString(row.metadata?.user_id);
        const entitlementId = asString(row.metadata?.entitlement_id);
        const reminderKey = asString(row.metadata?.reminder_key);
        return userId && entitlementId && reminderKey
          ? `${userId}:${entitlementId}:${reminderKey}`
          : null;
      })
      .filter((value): value is string => Boolean(value))
  );
}

async function getUserEmail(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) {
    console.warn(`Kon gebruiker ${userId} niet ophalen voor reminder:`, error.message);
    return null;
  }

  return data.user?.email ?? null;
}

export async function sendTherapistProfileReminderBatch(input: {
  dryRun?: boolean;
  now?: Date;
} = {}): Promise<TherapistProfileReminderResult> {
  const now = input.now ?? new Date();
  const nowIso = now.toISOString();
  const dryRun = Boolean(input.dryRun);
  const supabase = createAdminClient();

  const { data: entitlementRows, error: entitlementError } = await supabase
    .from("user_entitlements")
    .select("id, user_id, starts_at, ends_at, is_active, source, metadata")
    .eq("entitlement_key", THERAPIST_DIRECTORY_ENTITLEMENT_KEY)
    .eq("is_active", true)
    .returns<EntitlementRow[]>();

  if (entitlementError) {
    throw new Error(`Therapeut-abonnementen ophalen mislukt: ${entitlementError.message}`);
  }

  const activeRows = (entitlementRows ?? []).filter((row) =>
    isTimedEntitlementActive(row, nowIso)
  );
  const packIds = Array.from(
    new Set(activeRows.map(getPackId).filter((value): value is string => Boolean(value)))
  );
  const { data: packRows, error: packError } = packIds.length
    ? await supabase
        .from("credit_packs")
        .select("id, price_cents")
        .in("id", packIds)
        .returns<CreditPackRow[]>()
    : { data: [] as CreditPackRow[], error: null };

  if (packError) {
    throw new Error(`Therapeut-packs ophalen mislukt: ${packError.message}`);
  }

  const packPricesById = new Map(
    (packRows ?? []).map((pack) => [pack.id, pack.price_cents ?? 0])
  );
  const paidRows = activeRows.filter((row) => isPaidEntitlement(row, packPricesById));
  const candidates = selectReminderCandidates(paidRows, now);
  const userIds = candidates.map((candidate) => candidate.row.user_id);

  const { data: profileRows, error: profileError } = userIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, display_name, profile_data")
        .in("user_id", userIds)
        .returns<ProfileRow[]>()
    : { data: [] as ProfileRow[], error: null };

  if (profileError) {
    throw new Error(`Therapeut-profielen ophalen mislukt: ${profileError.message}`);
  }

  const profilesByUserId = new Map(
    (profileRows ?? []).map((profile) => [profile.user_id, profile])
  );
  const sentKeys = await getSentReminderKeys(userIds);
  const result: TherapistProfileReminderResult = {
    checked: activeRows.length,
    eligible: candidates.length,
    skippedReady: 0,
    skippedAlreadySent: 0,
    skippedMissingEmail: 0,
    sent: 0,
    failed: 0,
    dryRun,
    details: [],
  };

  for (const { row, reminderKey } of candidates) {
    const profileStatus = hasMeaningfulTherapistProfile(
      profilesByUserId.get(row.user_id)
    );
    if (profileStatus.ready) {
      result.skippedReady += 1;
      result.details.push({
        userId: row.user_id,
        entitlementId: row.id,
        reminderKey,
        status: "ready",
      });
      continue;
    }

    const sentKey = `${row.user_id}:${row.id}:${reminderKey}`;
    if (sentKeys.has(sentKey)) {
      result.skippedAlreadySent += 1;
      result.details.push({
        userId: row.user_id,
        entitlementId: row.id,
        reminderKey,
        status: "already_sent",
        issues: profileStatus.issues,
      });
      continue;
    }

    const email = await getUserEmail(row.user_id);
    if (!email) {
      result.skippedMissingEmail += 1;
      result.details.push({
        userId: row.user_id,
        entitlementId: row.id,
        reminderKey,
        status: "missing_email",
        issues: profileStatus.issues,
      });
      continue;
    }

    if (dryRun) {
      result.details.push({
        userId: row.user_id,
        entitlementId: row.id,
        reminderKey,
        email,
        status: "would_send",
        issues: profileStatus.issues,
      });
      continue;
    }

    try {
      await sendTransactionalEmail({
        templateType: "reminder",
        to: email,
        variables: {
          subject: "Maak je therapeutenprofiel zichtbaar",
          user_name:
            profilesByUserId.get(row.user_id)?.display_name?.trim() ||
            email.split("@")[0] ||
            "therapeut",
          reminder_text:
            "Je hebt een betaald therapeuten-abonnement, maar je profiel is nog niet volledig ingevuld of nog niet zichtbaar gezet in de therapeutenkaart. Vul je profiel aan en zet de publieke zichtbaarheid aan, zodat bezoekers je kunnen vinden.",
          action_label: "Profiel aanvullen",
          action_url: getPublicAreaUrl("/account?tab=profile"),
          reminder_label: getReminderLabel(reminderKey),
        },
        logMetadata: {
          reminder_kind: "therapist_profile_incomplete",
          reminder_key: reminderKey,
          reminder_label: getReminderLabel(reminderKey),
          user_id: row.user_id,
          entitlement_id: row.id,
          entitlement_started_at: row.starts_at,
          profile_issues: profileStatus.issues,
        },
      });
      result.sent += 1;
      result.details.push({
        userId: row.user_id,
        entitlementId: row.id,
        reminderKey,
        email,
        status: "sent",
        issues: profileStatus.issues,
      });
    } catch (error) {
      result.failed += 1;
      result.details.push({
        userId: row.user_id,
        entitlementId: row.id,
        reminderKey,
        email,
        status: "failed",
        issues: profileStatus.issues,
        error: error instanceof Error ? error.message : "Onbekende fout",
      });
    }
  }

  return result;
}
