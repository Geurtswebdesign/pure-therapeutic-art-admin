export type LanguageOption = {
  code: string;
  label: string;
};

export const DEFAULT_PRIMARY_LANGUAGE = "nl";
export const DEFAULT_SUPPORTED_LANGUAGES = [
  "nl",
  "en",
  "de",
  "pt",
  "es",
  "ar",
  "it",
] as const;

export function normalizeLanguageCode(value: string): string {
  return value.trim().replace(/_/g, "-").toLowerCase();
}

export function getLanguageBaseCode(value?: string | null): string {
  const normalized = normalizeLanguageCode(value ?? "");
  if (!normalized) {
    return "";
  }

  return normalized.split("-")[0] ?? "";
}

export function parseLanguageCodes(
  input: string | string[] | null | undefined
): string[] {
  const values = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(/[\n,]/)
      : [];

  const seen = new Set<string>();
  const codes: string[] = [];

  for (const value of values) {
    const normalized = normalizeLanguageCode(value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    codes.push(normalized);
  }

  return codes;
}

export function ensureLanguageCodes(
  codes: readonly string[],
  requiredCodes: readonly string[] = DEFAULT_SUPPORTED_LANGUAGES
): string[] {
  return parseLanguageCodes([...codes, ...requiredCodes]);
}

export function getLanguageDisplayLabel(
  code: string,
  displayLocale = DEFAULT_PRIMARY_LANGUAGE
): string {
  const normalized = normalizeLanguageCode(code);
  if (!normalized) {
    return "";
  }

  const baseCode = getLanguageBaseCode(normalized);
  const fallback = normalized.toUpperCase();

  try {
    const formatter = new Intl.DisplayNames([displayLocale], {
      type: "language",
    });
    const label = formatter.of(baseCode);

    if (!label) {
      return fallback;
    }

    const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
    return normalized === baseCode
      ? formattedLabel
      : `${formattedLabel} (${normalized})`;
  } catch {
    return fallback;
  }
}

export function buildLanguageOptions(
  codes: readonly string[],
  displayLocale = DEFAULT_PRIMARY_LANGUAGE
): LanguageOption[] {
  return ensureLanguageCodes(codes).map((code) => ({
    code,
    label: getLanguageDisplayLabel(code, displayLocale),
  }));
}

export function isKnownLanguage(
  value: string,
  supportedLanguages: readonly string[] = DEFAULT_SUPPORTED_LANGUAGES
): boolean {
  const code = normalizeLanguageCode(value);
  return ensureLanguageCodes(supportedLanguages).some((item) => item === code);
}
