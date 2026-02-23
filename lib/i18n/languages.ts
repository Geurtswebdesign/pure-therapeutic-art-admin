export type LanguageOption = {
  code: string;
  label: string;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "nl", label: "Nederlands" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Francais" },
  { code: "es", label: "Espanol" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Portugues" },
];

export const DEFAULT_PRIMARY_LANGUAGE = "nl";
export const DEFAULT_ENABLED_LANGUAGES = ["nl", "en", "de"];

export function normalizeLanguageCode(value: string): string {
  return value.trim().toLowerCase();
}

export function isKnownLanguage(value: string): boolean {
  const code = normalizeLanguageCode(value);
  return LANGUAGE_OPTIONS.some((item) => item.code === code);
}
