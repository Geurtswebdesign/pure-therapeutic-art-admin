import ThemePageCard from "@/components/content/ThemePageCard";
import { getPublishedThemePages } from "@/lib/content/theme-queries";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getPublicAppMessages } from "@/lib/i18n/publicAppMessages";

export default async function ThemePagesIndex() {
  const language = resolveUiLanguage(await getAppLanguage());
  const t = getPublicAppMessages(language).themeIndex;
  const themes = await getPublishedThemePages({ preferredLanguage: language });

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-stone-200 bg-[linear-gradient(180deg,#fdf8f1_0%,#f4eadf_100%)] p-5 shadow-sm">
        <div className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
          {t.eyebrow}
        </div>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-stone-950">
          {t.title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          {t.subtitle}
        </p>
      </section>

      {themes.length ? (
        <section className="grid gap-4">
          {themes.map((theme) => (
            <ThemePageCard key={theme.id} language={language} theme={theme} />
          ))}
        </section>
      ) : (
        <section className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white/70 p-6 text-sm leading-6 text-stone-600">
          {t.empty}
        </section>
      )}
    </div>
  );
}
