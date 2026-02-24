export type LanguageOption = {
  code: string;
  label: string;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "nl", label: "Nederlands" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
];

export const DEFAULT_PRIMARY_LANGUAGE = "nl";

export function normalizeLanguageCode(value: string): string {
  return value.trim().toLowerCase();
}

export function isKnownLanguage(value: string): boolean {
  const code = normalizeLanguageCode(value);
  return LANGUAGE_OPTIONS.some((item) => item.code === code);
}
