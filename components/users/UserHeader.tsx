import type { AdminUserProfile } from "@/lib/users/getUserDetail";
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";
import { getEffectiveAccountType } from "@/lib/users/accountTypes";

type Props = {
  user: AdminUserProfile;
  language: UiLanguage;
};

export default function UserHeader({ user, language }: Props) {
  const messages = getAppMessages(language);
  const t = messages.userHeader;
  const tabsT = messages.accountTabs;
  const locale = language === "en" ? "en-US" : language === "de" ? "de-DE" : "nl-NL";
  const displayName = user.display_name ?? user.email ?? "—";
  const createdAt = user.created_at ? new Date(user.created_at) : null;
  const accountType = getEffectiveAccountType(
    user.role,
    user.profile_data ?? null
  );
  const accountTypeLabel =
    accountType === "admin"
      ? tabsT.roleAdmin
      : accountType === "therapist"
        ? tabsT.roleTherapist
        : accountType === "client"
          ? tabsT.roleClient
          : tabsT.roleUser;

  return (
    <section className="rounded border bg-white p-4 space-y-1">
      <h1 className="text-xl font-semibold">{displayName}</h1>

      {user.email && (
        <p className="text-sm text-gray-600">{user.email}</p>
      )}

      <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
        {tabsT.accountType}: {accountTypeLabel}
      </p>

      {createdAt && (
        <p className="text-xs text-gray-500">
          {t.createdAt}: {createdAt.toLocaleString(locale)}
        </p>
      )}
    </section>
  );
}
