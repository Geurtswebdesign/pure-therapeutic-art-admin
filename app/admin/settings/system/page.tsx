import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

export default async function SettingsSystemPage() {
  const language = resolveUiLanguage(await getPrimaryLanguage());
  const t = getAdminMessages(language).settingsSystem;

  return (
    <section className="space-y-4 rounded border bg-white p-5">
      <h2 className="text-lg font-semibold">{t.title}</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
        {t.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
