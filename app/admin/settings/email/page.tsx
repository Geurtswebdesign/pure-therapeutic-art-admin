import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getEmailSettingsAdminData } from "@/lib/settings/email-actions";
import EmailSettingsForm from "@/components/admin/settings/EmailSettingsForm";

export default async function SettingsEmailPage() {
  const language = resolveUiLanguage(await getPrimaryLanguage());
  const settings = await getEmailSettingsAdminData();
  const t = getAdminMessages(language).settingsEmail;

  return (
    <div className="space-y-5">
      <section className="space-y-4 rounded border bg-white p-5">
        <h2 className="text-lg font-semibold">{t.title}</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
          {t.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <EmailSettingsForm
        language={language}
        smtpStatus={settings.smtp}
        templates={settings.templates}
        senderProfiles={settings.senderProfiles}
        branding={settings.branding}
        logs={settings.logs}
      />
    </div>
  );
}
