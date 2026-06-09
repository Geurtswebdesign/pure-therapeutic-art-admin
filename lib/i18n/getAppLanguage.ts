import { cache } from "react";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { APP_LANGUAGE_COOKIE_NAME } from "@/lib/i18n/language-cookie";
import {
  isKnownLanguage,
  normalizeLanguageCode,
} from "@/lib/i18n/languages";
import { getConfiguredLanguageSettings } from "@/lib/i18n/settings";
import type { AppProfileData } from "@/lib/users/accountTypes";

type ProfileLanguageRow = {
  profile_data?: AppProfileData | null;
};

export const getAppLanguage = cache(async (): Promise<string> => {
  const languageSettings = await getConfiguredLanguageSettings();
  const user = await getCurrentUser();

  if (user) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("profile_data")
        .eq("user_id", user.id)
        .maybeSingle<ProfileLanguageRow>();

      if (error) {
        console.error("[getAppLanguage]", error);
      } else {
        const preferredLanguage = data?.profile_data?.preferred_language;
        if (typeof preferredLanguage === "string" && preferredLanguage.trim()) {
          const code = normalizeLanguageCode(preferredLanguage);
          if (isKnownLanguage(code, languageSettings.supportedLanguages)) {
            return code;
          }
        }
      }
    } catch (error) {
      console.error("[getAppLanguage]", error);
    }
  }

  const cookieLanguage = (await cookies()).get(APP_LANGUAGE_COOKIE_NAME)?.value;
  if (cookieLanguage) {
    const normalizedCookieLanguage = normalizeLanguageCode(cookieLanguage);
    if (
      isKnownLanguage(
        normalizedCookieLanguage,
        languageSettings.supportedLanguages
      )
    ) {
      return normalizedCookieLanguage;
    }
  }

  const primaryLanguage = await getPrimaryLanguage();
  const normalized = normalizeLanguageCode(primaryLanguage);
  return isKnownLanguage(normalized, languageSettings.supportedLanguages)
    ? normalized
    : languageSettings.primaryLanguage;
});
