import {
  getCustomizerHeaderConfig,
  getCustomizerSettings,
  getGeneralSettings,
} from "@/lib/settings/actions";
import CustomizerSettingsForm from "@/components/admin/settings/CustomizerSettingsForm";

export default async function SettingsAppPage() {
  const [settings, general, headerConfig] = await Promise.all([
    getCustomizerSettings(),
    getGeneralSettings(),
    getCustomizerHeaderConfig(),
  ]);

  return (
    <section className="space-y-6">
      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold">Customizer</h1>
        <p className="mt-1 text-sm text-gray-600">
          Thema-instellingen voor kleuren, gradient en basis layout.
        </p>
      </header>
      <CustomizerSettingsForm
        initialValues={settings}
        brandingValues={{
          siteName: general.siteName,
          tagline: general.tagline,
          logoUrl: general.logoUrl,
        }}
        headerConfig={headerConfig}
      />
    </section>
  );
}
