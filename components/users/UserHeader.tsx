import type { AdminUserProfile } from "@/lib/users/getUserDetail";
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Props = {
  user: AdminUserProfile;
  language: UiLanguage;
};

export default function UserHeader({ user, language }: Props) {
  const t = getAppMessages(language).userHeader;
  const locale = language === "en" ? "en-US" : language === "de" ? "de-DE" : "nl-NL";
  const displayName = user.display_name ?? user.email ?? "—";
  const createdAt = user.created_at ? new Date(user.created_at) : null;

  return (
    <section className="rounded border bg-white p-4 space-y-1">
      <h1 className="text-xl font-semibold">{displayName}</h1>

      {user.email && (
        <p className="text-sm text-gray-600">{user.email}</p>
      )}

      {createdAt && (
        <p className="text-xs text-gray-500">
          {t.createdAt}: {createdAt.toLocaleString(locale)}
        </p>
      )}
    </section>
  );
}
