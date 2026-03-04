import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_GENERAL_SETTINGS } from "@/lib/settings/types";

type PublicBranding = {
  logoUrl: string | null;
  siteName: string;
  tagline: string;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

export const getPublicBranding = cache(async (): Promise<PublicBranding> => {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("scope", "global")
      .is("scope_id", null)
      .eq("key", "general")
      .maybeSingle<{ value: unknown }>();

    const value = asObject(data?.value);

    return {
      logoUrl: asString(value?.logoUrl, "") || null,
      siteName: asString(value?.siteName, DEFAULT_GENERAL_SETTINGS.siteName),
      tagline: asString(value?.tagline, DEFAULT_GENERAL_SETTINGS.tagline),
    };
  } catch {
    return {
      logoUrl: DEFAULT_GENERAL_SETTINGS.logoUrl || null,
      siteName: DEFAULT_GENERAL_SETTINGS.siteName,
      tagline: DEFAULT_GENERAL_SETTINGS.tagline,
    };
  }
});
