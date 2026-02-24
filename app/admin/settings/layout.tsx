import type { ReactNode } from "react";
import SettingsTabs from "@/components/admin/settings/SettingsTabs";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const primaryLanguagePromise = getPrimaryLanguage();
  return (
    <SettingsLayoutInner primaryLanguagePromise={primaryLanguagePromise}>
      {children}
    </SettingsLayoutInner>
  );
}

async function SettingsLayoutInner({
  children,
  primaryLanguagePromise,
}: {
  children: ReactNode;
  primaryLanguagePromise: Promise<string>;
}) {
  const primaryLanguage = await primaryLanguagePromise;
  const t = getAdminMessages(resolveUiLanguage(primaryLanguage));

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t.settingsLayout.title}</h1>
        <p className="text-sm text-gray-600">
          {t.settingsLayout.subtitle}
        </p>
      </header>
      <SettingsTabs language={primaryLanguage} />
      <div>{children}</div>
    </section>
  );
}
