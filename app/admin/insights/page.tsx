import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

export default async function InsightsPage() {
  const language = resolveUiLanguage(await getPrimaryLanguage());
  const t = getAdminMessages(language).insights;

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-gray-600">
          {t.subtitle}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded border bg-white p-4">
          <h2 className="text-base font-semibold">{t.revenue}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
            <li>{t.rev1}</li>
            <li>{t.rev2}</li>
            <li>{t.rev3}</li>
          </ul>
        </article>

        <article className="rounded border bg-white p-4">
          <h2 className="text-base font-semibold">{t.behavior}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
            <li>{t.beh1}</li>
            <li>{t.beh2}</li>
            <li>{t.beh3}</li>
          </ul>
        </article>

        <article className="rounded border bg-white p-4">
          <h2 className="text-base font-semibold">{t.funnel}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
            <li>{t.fun1}</li>
            <li>{t.fun2}</li>
            <li>{t.fun3}</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
