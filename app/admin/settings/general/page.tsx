import { getGeneralSettings } from "@/lib/settings/actions";
import GeneralSettingsForm from "@/components/admin/settings/GeneralSettingsForm";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

export default async function SettingsGeneralPage() {
  const settings = await getGeneralSettings();
  const language = resolveUiLanguage(settings.primaryLanguage);
  const t = getAdminMessages(language).settingsGeneral;

  return (
    <section className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t.title}</h2>
        <p className="text-sm text-gray-600">
          {t.desc}
        </p>
      </div>

      <GeneralSettingsForm initialValues={settings} />
    </section>
  );
}
