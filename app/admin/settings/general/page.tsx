import { getGeneralSettings } from "@/lib/settings/actions";
import GeneralSettingsForm from "@/components/admin/settings/GeneralSettingsForm";

export default async function SettingsGeneralPage() {
  const settings = await getGeneralSettings();

  return (
    <section className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">General Settings</h2>
        <p className="text-sm text-gray-600">
          Platform branding en basis configuratie.
        </p>
      </div>

      <GeneralSettingsForm initialValues={settings} />
    </section>
  );
}
