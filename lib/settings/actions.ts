"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth/getAdminUser";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_GENERAL_SETTINGS,
  type GeneralSettings,
} from "@/lib/settings/types";
import {
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

  const supabase = createAdminClient();
  const value = {
    ...settings,
    primaryLanguage: normalizedPrimary,
  };

  const { data: existing, error: existingError } = await supabase
    .from("app_settings")
    .select("id")
    .eq("scope", "global")
    .is("scope_id", null)
    .eq("key", "general")
    .maybeSingle<{ id: string }>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const { error } = existing
    ? await supabase
        .from("app_settings")
        .update({
          value,
          updated_by: adminId ?? admin.id,
        })
        .eq("id", existing.id)
    : await supabase.from("app_settings").insert({
        scope: "global",
        scope_id: null,
        key: "general",
        value,
        updated_by: adminId ?? admin.id,
      });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/settings/general");
}
