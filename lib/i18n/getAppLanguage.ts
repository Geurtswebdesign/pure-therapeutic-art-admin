import { cache } from "react";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import {
  DEFAULT_PRIMARY_LANGUAGE,
  isKnownLanguage,
  normalizeLanguageCode,
} from "@/lib/i18n/languages";
import type { AppProfileData } from "@/lib/users/accountTypes";

type ProfileLanguageRow = {
  profile_data?: AppProfileData | null;
};

export const getAppLanguage = cache(async (): Promise<string> => {
  const user = await getCurrentUser();

  if (user) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("profiles")
      .select("profile_data")
      .eq("user_id", user.id)
      .maybeSingle<ProfileLanguageRow>();

    const preferredLanguage = data?.profile_data?.preferred_language;
    if (typeof preferredLanguage === "string" && preferredLanguage.trim()) {
      const code = normalizeLanguageCode(preferredLanguage);
      if (isKnownLanguage(code)) {
        return code;
      }
    }
  }

  const primaryLanguage = await getPrimaryLanguage();
  const normalized = normalizeLanguageCode(primaryLanguage);
  return isKnownLanguage(normalized) ? normalized : DEFAULT_PRIMARY_LANGUAGE;
});
