import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import { getSecuritySettings } from "@/lib/settings/security-actions";
import SecuritySettingsForm from "@/components/admin/settings/SecuritySettingsForm";

type SecuritySearchParams = {
  mfa?: string | string[];
};

export default async function SettingsSecurityPage({
  searchParams,
}: {
  searchParams?: Promise<SecuritySearchParams>;
}) {
  const language = resolveUiLanguage(await getPrimaryLanguage());
  const messages = getAdminMessages(language).settingsSecurity;
  const settings = await getSecuritySettings();
  const params = await searchParams;
  const mfa =
    typeof params?.mfa === "string"
      ? params.mfa
      : Array.isArray(params?.mfa)
        ? params?.mfa[0]
        : undefined;
  const showRequired = mfa === "required";

  return (
    <section className="w-full space-y-6">
      <header className="rounded-lg border bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold">{messages.title}</h1>
        <p className="mt-1 text-sm text-gray-600">{messages.subtitle}</p>
      </header>

      {showRequired ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          2FA is vereist voor admins. Activeer 2FA om verder te gaan.
        </div>
      ) : null}

      <SecuritySettingsForm initialValues={settings} language={language} />
    </section>
  );
}
