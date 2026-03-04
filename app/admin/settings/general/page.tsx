import { getGeneralSettings } from "@/lib/settings/actions";
import GeneralSettingsForm from "@/components/admin/settings/GeneralSettingsForm";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

export default async function SettingsGeneralPage() {
  const settings = await getGeneralSettings();
  const language = resolveUiLanguage(settings.primaryLanguage);
  const t = getAdminMessages(language).settingsGeneral;

  return (
    <section className="w-full space-y-6">
      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold">{t.title}</h1>
        <p className="mt-1 text-sm text-gray-600">{t.desc}</p>
      </header>

      <GeneralSettingsForm initialValues={settings} />
    </section>
  );
}
