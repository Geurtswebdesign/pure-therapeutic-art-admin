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
        {settings.deliveryStats.length ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {settings.deliveryStats.map((row) => (
              <article key={row.senderKey} className="rounded border bg-gray-50 p-4">
                <p className="truncate text-sm font-semibold text-gray-900">{row.senderKey}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                    Succesvol: {row.sent}
                  </span>
                  <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
                    Mislukt: {row.failed}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nog geen e-mailstatistieken beschikbaar.</p>
        )}
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
