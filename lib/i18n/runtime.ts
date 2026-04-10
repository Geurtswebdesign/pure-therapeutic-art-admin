import {
  DEFAULT_PRIMARY_LANGUAGE,
  getLanguageBaseCode,
  normalizeLanguageCode,
} from "@/lib/i18n/languages";

export type BaseUiLanguage = "nl" | "en" | "de";
export type UiLanguage = string;

export function resolveUiLanguage(input?: string | null): UiLanguage {
  return getLanguageBaseCode(input) || DEFAULT_PRIMARY_LANGUAGE;
}

export function resolveBaseUiLanguage(
  input?: string | null
): BaseUiLanguage {
  const language = resolveUiLanguage(input);
  if (language === "en" || language === "de") {
    return language;
  }

  return "nl";
}

export function resolveLanguageLocale(input?: string | null): string {
  const normalized = normalizeLanguageCode(input ?? "");
  if (normalized) {
    try {
      return Intl.getCanonicalLocales(normalized)[0] ?? normalized;
    } catch {
      const baseCode = getLanguageBaseCode(normalized);
      if (baseCode) {
        try {
          return Intl.getCanonicalLocales(baseCode)[0] ?? baseCode;
        } catch {
          // fall through
        }
      }
    }
  }

  return "nl-NL";
}
