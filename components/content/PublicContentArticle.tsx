import Image from "next/image";
import Link from "next/link";
import type { ContentBlock } from "@/lib/content/types";
import { normalizeImages } from "@/lib/content/normalizeHtml";
import PublicBlockRenderer from "@/components/content/PublicBlockRenderer";
import type { ThemeItemNavigation } from "@/lib/content/public-queries";

type Item = {
  title: string | null;
  excerpt?: string | null;
  body?: string | null;
  featured_image_url?: string | null;
  featured_image_alt?: string | null;
  credit_cost?: number | null;
};

export default function PublicContentArticle({
  item,
  blocks,
  isSeedCategory,
  themeNavigation,
}: {
  item: Item;
  blocks: ContentBlock[];
  isSeedCategory: boolean;
  themeNavigation?: ThemeItemNavigation | null;
  languageLabel: string;
  statusLabel?: string | null;
}) {
  return (
    <article
      className={
        isSeedCategory
          ? "mx-auto max-w-4xl rounded-[2rem] border border-stone-200 bg-white/85 p-6 py-12 shadow-[0_24px_60px_rgba(28,25,23,0.08)] backdrop-blur sm:p-8 lg:p-10"
          : "mx-auto max-w-2xl rounded-[1.5rem] border border-[#e4d8cb] bg-[#f8f3ed] p-5 shadow-sm sm:p-7"
      }
    >
      <header className={isSeedCategory ? "mb-8 space-y-4" : "mb-7 space-y-3"}>
        <h1
          className={
            isSeedCategory
              ? "text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl"
              : "text-3xl font-semibold tracking-tight text-stone-950"
          }
        >
          {item.title}
        </h1>

        {item.excerpt ? (
          <p
            className={
              isSeedCategory
                ? "max-w-3xl text-lg leading-8 text-stone-600"
                : "mx-auto max-w-xl text-sm leading-6 text-stone-600"
            }
          >
            {item.excerpt}
          </p>
        ) : null}
      </header>

      {item.featured_image_url ? (
        <Image
          src={item.featured_image_url}
          alt={item.featured_image_alt || item.title || "Afbeelding"}
          width={1200}
          height={630}
          unoptimized
          className={
            isSeedCategory
              ? "mb-8 h-auto w-full rounded-[1.5rem] border border-stone-200 object-cover"
              : "mx-auto mb-8 h-auto w-full max-w-md rounded-[1.25rem] border border-[#ddcfbf] object-cover"
          }
        />
      ) : null}

      {item.body ? (
        <div
          className={
            isSeedCategory
              ? "prose mb-10 max-w-none prose-headings:text-stone-900 prose-p:text-stone-700 prose-strong:text-stone-900 prose-a:text-stone-900 lg:prose-lg"
              : "prose prose-sm mb-8 max-w-none prose-headings:mt-6 prose-headings:text-stone-900 prose-p:text-stone-800 prose-li:text-stone-800 prose-strong:text-stone-900 prose-a:text-stone-900"
          }
          dangerouslySetInnerHTML={{ __html: normalizeImages(item.body) }}
        />
      ) : null}

      {blocks.length > 0 ? (
        <div className={isSeedCategory ? "space-y-8" : "space-y-6"}>
          <PublicBlockRenderer blocks={blocks} />
        </div>
      ) : null}

      {themeNavigation ? (
        <section className="mt-8 rounded-[1.25rem] border border-[#ddcfbf] bg-white/80 p-4 sm:p-5">
          <div className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
            Onderdeel van thema
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
                  Vorige
                </div>
                <div className="mt-1 text-base font-medium leading-6 text-stone-900">
                  {themeNavigation.previous.title}
                </div>
              </Link>
            ) : (
              <div className="rounded-[1rem] border border-dashed border-stone-200 px-4 py-3 text-sm text-stone-400">
                Geen vorig onderdeel
              </div>
            )}

            {themeNavigation.next ? (
              <Link
                href={themeNavigation.next.href}
                className="rounded-[1rem] border border-stone-200 bg-[#f8f3ed] px-4 py-3"
              >
                <div className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                  Volgende
                </div>
                <div className="mt-1 text-base font-medium leading-6 text-stone-900">
                  {themeNavigation.next.title}
                </div>
              </Link>
            ) : (
              <div className="rounded-[1rem] border border-dashed border-stone-200 px-4 py-3 text-sm text-stone-400">
                Geen volgend onderdeel
              </div>
            )}
          </div>
        </section>
      ) : null}
    </article>
  );
}
