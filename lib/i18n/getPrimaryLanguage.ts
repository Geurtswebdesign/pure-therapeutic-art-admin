import { getConfiguredLanguageSettings } from "@/lib/i18n/settings";

export async function getPrimaryLanguage(): Promise<string> {
  const settings = await getConfiguredLanguageSettings();
  return settings.primaryLanguage;
}
