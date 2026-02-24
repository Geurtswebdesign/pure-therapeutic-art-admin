import { supabaseAdmin } from "@/lib/supabase/admin";
import { DEFAULT_PRIMARY_LANGUAGE, normalizeLanguageCode } from "@/lib/i18n/languages";

export async function getPrimaryLanguage(): Promise<string> {
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("scope", "global")
    .is("scope_id", null)
    .eq("key", "general")
    .maybeSingle<{ value: { primaryLanguage?: string } }>();

  const value = data?.value?.primaryLanguage;
  if (typeof value !== "string" || !value.trim()) {
    return DEFAULT_PRIMARY_LANGUAGE;
  }

  return normalizeLanguageCode(value);
}
