import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_PRIMARY_LANGUAGE,
  DEFAULT_SUPPORTED_LANGUAGES,
  buildLanguageOptions,
  ensureLanguageCodes,
  normalizeLanguageCode,
  parseLanguageCodes,
} from "@/lib/i18n/languages";

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export const getConfiguredLanguageSettings = cache(
  async (): Promise<{
    primaryLanguage: string;
    supportedLanguages: string[];
  }> => {
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
      const primaryLanguage = normalizeLanguageCode(
        typeof value?.primaryLanguage === "string"
          ? value.primaryLanguage
          : DEFAULT_PRIMARY_LANGUAGE
      ) || DEFAULT_PRIMARY_LANGUAGE;
      const supportedLanguages = ensureLanguageCodes(
        parseLanguageCodes(
          Array.isArray(value?.supportedLanguages)
            ? (value?.supportedLanguages as string[])
            : typeof value?.supportedLanguages === "string"
              ? value.supportedLanguages
              : []
        ),
        [primaryLanguage, ...DEFAULT_SUPPORTED_LANGUAGES]
      );

      return {
        primaryLanguage,
        supportedLanguages,
      };
    } catch {
      return {
        primaryLanguage: DEFAULT_PRIMARY_LANGUAGE,
        supportedLanguages: [...DEFAULT_SUPPORTED_LANGUAGES],
      };
    }
  }
);

export const getSupportedLanguageCodes = cache(async (): Promise<string[]> => {
  const settings = await getConfiguredLanguageSettings();
  return settings.supportedLanguages;
});

export const getSupportedLanguageOptions = cache(
  async (displayLocale = DEFAULT_PRIMARY_LANGUAGE) =>
    buildLanguageOptions(await getSupportedLanguageCodes(), displayLocale)
);
