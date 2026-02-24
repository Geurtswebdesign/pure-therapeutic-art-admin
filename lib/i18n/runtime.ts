export type UiLanguage = "nl" | "en" | "de";

export function resolveUiLanguage(input?: string | null): UiLanguage {
  const value = (input ?? "").trim().toLowerCase();
  if (value.startsWith("en")) return "en";
  if (value.startsWith("de")) return "de";
  return "nl";
}
