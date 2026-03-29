import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ContentBlock } from "@/lib/content/types";
import { normalizeImages } from "@/lib/content/normalizeHtml";
import PublicBlockRenderer from "@/components/content/PublicBlockRenderer";
import RichTextExcerpt from "@/components/content/RichTextExcerpt";
import type { ThemeItemNavigation } from "@/lib/content/public-queries";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Item = {
  title: string | null;
  excerpt?: string | null;
  body?: string | null;
  featured_image_url?: string | null;
  featured_image_alt?: string | null;
};

const messagesByLanguage = {
  nl: {
    back: "Terug naar EBooks",
    eyebrow: "E-book reader",
    intro:
      "Lees dit e-book veilig binnen de app. Kopieren, selecteren en standaard printacties zijn in de reader beperkt.",
    theme: "Onderdeel van thema",
    previous: "Vorige",
    next: "Volgende",
    noPrevious: "Geen vorig onderdeel",
    noNext: "Geen volgend onderdeel",
  },
  en: {
    back: "Back to EBooks",
    eyebrow: "E-book reader",
    intro:
      "Read this e-book safely inside the app. Copying, selecting and standard print actions are limited in the reader.",
    theme: "Part of theme",
    previous: "Previous",
    next: "Next",
    noPrevious: "No previous item",
    noNext: "No next item",
  },
  de: {
    back: "Zuruck zu EBooks",
    eyebrow: "E-Book-Reader",
    intro:
      "Lies dieses E-Book sicher in der App. Kopieren, Markieren und Standard-Druckaktionen sind im Reader eingeschrankt.",
    theme: "Teil eines Themas",
    previous: "Vorheriges",
    next: "Nachstes",
    noPrevious: "Kein vorheriger Teil",
    noNext: "Kein nachster Teil",
  },
} as const;

export default function AccountEbookReader({
  item,
  blocks,
  themeNavigation,
  progressCard,
  language,
}: {
  item: Item;
  blocks: ContentBlock[];
  themeNavigation?: ThemeItemNavigation | null;
  progressCard?: ReactNode;
  language: UiLanguage;
}) {
  const t = messagesByLanguage[language] ?? messagesByLanguage.nl;

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/account?panel=ebooks"
          className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800"
        >
          {t.back}
        </Link>
      </div>

      <article className="rounded-[1.75rem] border border-[#e4d8cb] bg-[#f8f3ed] p-5 shadow-sm sm:p-7">
        <header className="mb-7 space-y-3">
          <div className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
            {t.eyebrow}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
            {item.title}
          </h1>

          {item.excerpt ? (
            <RichTextExcerpt
              html={item.excerpt}
              className="max-w-xl text-stone-600 [&_p]:m-0 [&_p+p]:mt-3 [&_p]:text-sm [&_p]:leading-6 [&_strong]:text-stone-800 [&_a]:text-stone-800"
            />
          ) : null}

          <div className="rounded-[1.1rem] border border-dashed border-[#d9c7b8] bg-white/80 px-4 py-3 text-sm leading-6 text-stone-600">
            {t.intro}
          </div>
        </header>

        {item.featured_image_url ? (
          <Image
            src={item.featured_image_url}
            alt={item.featured_image_alt || item.title || "Afbeelding"}
            width={1200}
            height={630}
            unoptimized
            className="mx-auto mb-8 h-auto w-full max-w-md rounded-[1.25rem] border border-[#ddcfbf] object-cover"
          />
        ) : null}

        {item.body ? (
          <div
            className="prose prose-sm mb-8 max-w-none prose-headings:mt-6 prose-headings:text-stone-900 prose-p:text-stone-800 prose-li:text-stone-800 prose-strong:text-stone-900 prose-a:text-stone-900"
            dangerouslySetInnerHTML={{ __html: normalizeImages(item.body) }}
          />
        ) : null}

        {blocks.length > 0 ? (
          <div className="space-y-6">
            <PublicBlockRenderer blocks={blocks} />
          </div>
        ) : null}

        {themeNavigation ? (
          <section className="mt-8 rounded-[1.25rem] border border-[#ddcfbf] bg-white/80 p-4 sm:p-5">
            <div className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
              {t.theme}
            </div>
            <div className="mt-2">
              <Link
                href={`/content/themas/${themeNavigation.theme.slug}`}
                className="font-medium text-stone-900 hover:underline"
              >
                {themeNavigation.theme.title}
              </Link>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {themeNavigation.previous ? (
                <Link
                  href={themeNavigation.previous.href}
                  className="rounded-[1rem] border border-stone-200 bg-[#f8f3ed] px-4 py-3"
                >
                  <div className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                    {t.previous}
                  </div>
                  <div className="mt-1 text-base font-medium leading-6 text-stone-900">
                    {themeNavigation.previous.title}
                  </div>
                </Link>
              ) : (
                <div className="rounded-[1rem] border border-dashed border-stone-200 px-4 py-3 text-sm text-stone-400">
                  {t.noPrevious}
                </div>
              )}

              {themeNavigation.next ? (
                <Link
                  href={themeNavigation.next.href}
                  className="rounded-[1rem] border border-stone-200 bg-[#f8f3ed] px-4 py-3"
                >
                  <div className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                    {t.next}
                  </div>
                  <div className="mt-1 text-base font-medium leading-6 text-stone-900">
                    {themeNavigation.next.title}
                  </div>
                </Link>
              ) : (
                <div className="rounded-[1rem] border border-dashed border-stone-200 px-4 py-3 text-sm text-stone-400">
                  {t.noNext}
                </div>
              )}
            </div>
          </section>
        ) : null}

        {progressCard ? <div className="mt-8">{progressCard}</div> : null}
      </article>
    </section>
  );
}
