"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth/getAdminUser";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_GENERAL_SETTINGS,
  type GeneralSettings,
} from "@/lib/settings/types";
import {
  DEFAULT_ENABLED_LANGUAGES,
  DEFAULT_PRIMARY_LANGUAGE,
  normalizeLanguageCode,
} from "@/lib/i18n/languages";

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const next = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => normalizeLanguageCode(item))
    .filter(Boolean);
  return next.length > 0 ? Array.from(new Set(next)) : fallback;
}

export async function getGeneralSettings(): Promise<GeneralSettings> {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Niet geautoriseerd");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("scope", "global")
    .is("scope_id", null)
    .eq("key", "general")
    .maybeSingle<{ value: unknown }>();

  if (error) {
    throw new Error(error.message);
  }

  const value = asObject(data?.value);

  return {
    siteName: asString(value?.siteName, DEFAULT_GENERAL_SETTINGS.siteName),
    tagline: asString(value?.tagline, DEFAULT_GENERAL_SETTINGS.tagline),
    timezone: asString(value?.timezone, DEFAULT_GENERAL_SETTINGS.timezone),
    locale: asString(value?.locale, DEFAULT_GENERAL_SETTINGS.locale),
    currency: asString(value?.currency, DEFAULT_GENERAL_SETTINGS.currency),
    primaryLanguage: normalizeLanguageCode(
      asString(value?.primaryLanguage, DEFAULT_GENERAL_SETTINGS.primaryLanguage)
    ),
    enabledLanguages: asStringArray(
      value?.enabledLanguages,
      DEFAULT_GENERAL_SETTINGS.enabledLanguages
    ),
  };
}

export async function saveGeneralSettings(
  settings: GeneralSettings,
  adminId?: string
) {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Niet geautoriseerd");
  }

  const normalizedPrimary = normalizeLanguageCode(
    settings.primaryLanguage || DEFAULT_PRIMARY_LANGUAGE
  );
  const normalizedEnabled = Array.from(
    new Set(
      (settings.enabledLanguages.length
        ? settings.enabledLanguages
        : DEFAULT_ENABLED_LANGUAGES
      )
        .map((item) => normalizeLanguageCode(item))
        .filter(Boolean)
    )
  );

  if (!normalizedEnabled.includes(normalizedPrimary)) {
    normalizedEnabled.unshift(normalizedPrimary);
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("app_settings").upsert(
    {
      scope: "global",
      scope_id: null,
      key: "general",
      value: {
        ...settings,
        primaryLanguage: normalizedPrimary,
        enabledLanguages: normalizedEnabled,
      },
      updated_by: adminId ?? admin.id,
    },
    { onConflict: "scope,scope_id,key" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/settings/general");
}
