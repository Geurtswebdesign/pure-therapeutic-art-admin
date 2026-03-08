"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth/getAdminUser";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSecurityAuditEvent } from "@/lib/security/audit";
import {
  DEFAULT_GENERAL_SETTINGS,
  type CustomizerHeaderConfig,
  type CustomizerHeaderRule,
  type CustomizerHeaderTargetType,
  DEFAULT_CUSTOMIZER_SETTINGS,
  type CustomizerSettings,
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

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
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
    logoUrl: asString(value?.logoUrl, DEFAULT_GENERAL_SETTINGS.logoUrl),
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

  const previousSettings = existing
    ? await supabase
        .from("app_settings")
        .select("value")
        .eq("id", existing.id)
        .maybeSingle<{ value: unknown }>()
    : null;

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

  await logSecurityAuditEvent({
    eventType: "general_settings_updated",
    actorUserId: adminId ?? admin.id,
    details: {
      previous: previousSettings?.data?.value ?? null,
      next: value,
    },
  });

  revalidatePath("/admin/settings/general");
}

export async function saveBrandingSettings(
  branding: Pick<GeneralSettings, "siteName" | "tagline" | "logoUrl">,
  adminId?: string
) {
  const current = await getGeneralSettings();
  await saveGeneralSettings(
    {
      ...current,
      siteName: branding.siteName,
      tagline: branding.tagline,
      logoUrl: branding.logoUrl,
    },
    adminId
  );
  revalidatePath("/admin/settings/app");
}

export async function getCustomizerSettings(): Promise<CustomizerSettings> {
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
    .eq("key", "customizer")
    .maybeSingle<{ value: unknown }>();

  if (error) {
    throw new Error(error.message);
  }

  const value = asObject(data?.value);

  return {
    primaryColor: asString(
      value?.primaryColor,
      DEFAULT_CUSTOMIZER_SETTINGS.primaryColor
    ),
    secondaryColor: asString(
      value?.secondaryColor,
      DEFAULT_CUSTOMIZER_SETTINGS.secondaryColor
    ),
    gradientFrom: asString(
      value?.gradientFrom,
      DEFAULT_CUSTOMIZER_SETTINGS.gradientFrom
    ),
    gradientTo: asString(
      value?.gradientTo,
      DEFAULT_CUSTOMIZER_SETTINGS.gradientTo
    ),
    cardRadius: asString(value?.cardRadius, DEFAULT_CUSTOMIZER_SETTINGS.cardRadius),
    fontScale: asString(value?.fontScale, DEFAULT_CUSTOMIZER_SETTINGS.fontScale),
  };
}

export async function saveCustomizerSettings(
  settings: CustomizerSettings,
  adminId?: string
) {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Niet geautoriseerd");
  }

  const supabase = createAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("app_settings")
    .select("id")
    .eq("scope", "global")
    .is("scope_id", null)
    .eq("key", "customizer")
    .maybeSingle<{ id: string }>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const previousSettings = existing
    ? await supabase
        .from("app_settings")
        .select("value")
        .eq("id", existing.id)
        .maybeSingle<{ value: unknown }>()
    : null;

  const { error } = existing
    ? await supabase
        .from("app_settings")
        .update({
          value: settings,
          updated_by: adminId ?? admin.id,
        })
        .eq("id", existing.id)
    : await supabase.from("app_settings").insert({
        scope: "global",
        scope_id: null,
        key: "customizer",
        value: settings,
        updated_by: adminId ?? admin.id,
      });

  if (error) {
    throw new Error(error.message);
  }

  await logSecurityAuditEvent({
    eventType: "customizer_settings_updated",
    actorUserId: adminId ?? admin.id,
    details: {
      previous: previousSettings?.data?.value ?? null,
      next: settings,
    },
  });

  revalidatePath("/admin/settings/app");
}

export async function getCustomizerHeaderConfig(): Promise<CustomizerHeaderConfig> {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Niet geautoriseerd");
  }

  const supabase = createAdminClient();
  const empty: CustomizerHeaderConfig = {
    headers: [],
    rules: [],
    fallbackHeaderId: null,
    categories: [],
  };

  try {
    const [headersRes, rulesRes, fallbackRes, categoriesRes, taxonomyRes] = await Promise.all([
      supabase
        .from("customizer_headers")
        .select("id, name, logo_url, logo_alt, subtitle, is_active, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("customizer_header_rules")
        .select("id, header_id, target_type, target_value")
        .order("target_type", { ascending: true }),
      supabase
        .from("app_settings")
        .select("value")
        .eq("scope", "global")
        .is("scope_id", null)
        .eq("key", "customizer_header_fallback")
        .maybeSingle<{ value: unknown }>(),
      supabase
        .from("content_terms")
        .select("slug, name, taxonomy_id, is_active")
        .eq("is_active", true),
      supabase
        .from("content_taxonomies")
        .select("id")
        .eq("slug", "category")
        .maybeSingle<{ id: string }>(),
    ]);

    const taxonomyId = taxonomyRes.data?.id ?? null;
    const categories = (categoriesRes.data ?? [])
      .filter((c) => c.taxonomy_id === taxonomyId)
      .map((c) => ({ slug: c.slug as string, name: c.name as string }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      headers: (headersRes.data ?? []).map((row) => ({
        id: row.id as string,
        name: asString(row.name, "Header"),
        logoUrl: asString(row.logo_url, ""),
        logoAlt: asString(row.logo_alt, ""),
        subtitle: asString(row.subtitle, ""),
        isActive: asBoolean(row.is_active, true),
        sortOrder: asNumber(row.sort_order, 0),
      })),
      rules: (rulesRes.data ?? []).map((row) => ({
        id: row.id as string,
        headerId: row.header_id as string,
        targetType: row.target_type as CustomizerHeaderTargetType,
        targetValue: asString(row.target_value, ""),
      })),
      fallbackHeaderId: asObject(fallbackRes.data?.value)?.headerId as string | null,
      categories,
    };
  } catch {
    return empty;
  }
}

export async function saveCustomizerHeaderConfig(
  config: Pick<CustomizerHeaderConfig, "headers" | "rules" | "fallbackHeaderId">,
  adminId?: string
) {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Niet geautoriseerd");
  }

  const supabase = createAdminClient();
  const actorId = adminId ?? admin.id;

  const headersPayload = config.headers.map((h, index) => ({
    id: h.id,
    name: h.name,
    logo_url: h.logoUrl,
    logo_alt: h.logoAlt,
    subtitle: h.subtitle,
    is_active: h.isActive,
    sort_order: Number.isFinite(h.sortOrder) ? h.sortOrder : index,
    updated_by: actorId,
  }));

  const rulesPayload = config.rules
    .filter((r) => r.headerId && r.targetValue)
    .map((r) => ({
      id: r.id,
      header_id: r.headerId,
      target_type: r.targetType,
      target_value: r.targetValue,
      updated_by: actorId,
    }));

  const existingHeaders = await supabase.from("customizer_headers").select("id");
  const existingHeaderIds = new Set((existingHeaders.data ?? []).map((r) => r.id as string));
  const incomingHeaderIds = new Set(headersPayload.map((r) => r.id));
  const deleteHeaderIds = Array.from(existingHeaderIds).filter((id) => !incomingHeaderIds.has(id));

  const existingRules = await supabase.from("customizer_header_rules").select("id");
  const existingRuleIds = new Set((existingRules.data ?? []).map((r) => r.id as string));
  const incomingRuleIds = new Set(rulesPayload.map((r) => r.id));
  const deleteRuleIds = Array.from(existingRuleIds).filter((id) => !incomingRuleIds.has(id));

  if (headersPayload.length) {
    const { error } = await supabase
      .from("customizer_headers")
      .upsert(headersPayload, { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  if (rulesPayload.length) {
    const { error } = await supabase
      .from("customizer_header_rules")
      .upsert(rulesPayload, { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  if (deleteRuleIds.length) {
    const { error } = await supabase
      .from("customizer_header_rules")
      .delete()
      .in("id", deleteRuleIds);
    if (error) throw new Error(error.message);
  }

  if (deleteHeaderIds.length) {
    const { error } = await supabase
      .from("customizer_headers")
      .delete()
      .in("id", deleteHeaderIds);
    if (error) throw new Error(error.message);
  }

  const { data: fallbackSetting } = await supabase
    .from("app_settings")
    .select("id")
    .eq("scope", "global")
    .is("scope_id", null)
    .eq("key", "customizer_header_fallback")
    .maybeSingle<{ id: string }>();

  const fallbackValue = { headerId: config.fallbackHeaderId ?? null };
  if (fallbackSetting?.id) {
    const { error } = await supabase
      .from("app_settings")
      .update({ value: fallbackValue, updated_by: actorId })
      .eq("id", fallbackSetting.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("app_settings").insert({
      scope: "global",
      scope_id: null,
      key: "customizer_header_fallback",
      value: fallbackValue,
      updated_by: actorId,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/settings/app");
}
