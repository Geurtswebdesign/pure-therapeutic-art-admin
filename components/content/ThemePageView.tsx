import Link from "next/link";
import RichTextExcerpt from "@/components/content/RichTextExcerpt";
import HistoryBackButton from "@/components/public/HistoryBackButton";
import type { ThemePageDetail } from "@/lib/content/theme-queries";
import type { UiLanguage } from "@/lib/i18n/runtime";
import { getPublicAppMessages } from "@/lib/i18n/publicAppMessages";

export default function ThemePageView({
  theme,
  language = "nl",
  backHref,
  backLabel,
}: {
  theme: ThemePageDetail;
  language?: UiLanguage;
  backHref?: string;
  backLabel?: string;
}) {
  const t = getPublicAppMessages(language).themePage;
  const visibleSections = theme.sections.filter((section) => section.items.length > 0);
  const resolvedBackHref =
    backHref ??
    (theme.parentTheme
      ? `/content/themas/${theme.parentTheme.slug}`
      : theme.primaryCategory
        ? `/content?category=${theme.primaryCategory.slug}`
        : "/content");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="rounded-[1.75rem] border border-[#e4d8cb] bg-[#f8f3ed] p-5 shadow-sm sm:p-7">
        <header className="mt-6">
          <h1 className="font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
            {theme.title}
          </h1>
          {theme.description ? (
            <RichTextExcerpt
              html={theme.description}
              className="mt-3 text-sm leading-6 text-stone-600 [&_p]:m-0 [&_p+p]:mt-3 [&_strong]:text-stone-800 [&_em]:text-stone-600 [&_a]:text-stone-800 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1"
            />
          ) : null}
        </header>
        <div className="flex items-start justify-between gap-3">
          <HistoryBackButton
            fallbackHref={resolvedBackHref}
            className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
          >
            {backLabel ?? t.back}
          </HistoryBackButton>
        </div>
        {theme.childThemes.length ? (
          <div className="mt-6 border-t border-[#ddd0c4] pt-5">
            <div className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
              {t.subthemes}
            </div>
            <ol className="mt-3 space-y-2 text-stone-900">
              {theme.childThemes.map((childTheme, index) => (
                <li key={childTheme.id}>
                  <Link
                    href={`/content/themas/${childTheme.slug}`}
                    className="text-base font-medium hover:underline"
                  >
                    {index + 1}. {childTheme.title}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>

      {visibleSections.length ? (
        <div className="space-y-4">
          {visibleSections.map((section) => (
            <section
              key={section.id}
              className="rounded-[1.75rem] border border-[#e4d8cb] bg-white p-5 shadow-sm sm:p-7"
            >
              {section.title ? (
                <header className="border-b border-[#efe3d8] pb-4">
                  <h2 className="font-serif text-2xl leading-tight text-stone-950 sm:text-3xl">
                    {section.title}
                  </h2>
                </header>
              ) : null}

              {section.description ? (
                <RichTextExcerpt
                  html={section.description}
                  className={`${section.title ? "mt-4" : ""} text-sm leading-6 text-stone-600 [&_p]:m-0 [&_p+p]:mt-3 [&_strong]:text-stone-800 [&_em]:text-stone-600 [&_a]:text-stone-800 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1`}
                />
              ) : null}

              <ol
                type="a"
                className="mt-4 list-outside space-y-2.5 pl-6 text-lg leading-8 text-stone-900 marker:font-semibold"
              >
                {section.items.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="block py-1 hover:underline">
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
