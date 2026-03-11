import Image from "next/image";
import type { ContentBlock } from "@/lib/content/types";
import { normalizeImages } from "@/lib/content/normalizeHtml";
import PublicBlockRenderer from "@/components/content/PublicBlockRenderer";

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
  languageLabel,
  statusLabel,
}: {
  item: Item;
  blocks: ContentBlock[];
  isSeedCategory: boolean;
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
      <header className={isSeedCategory ? "mb-8 space-y-4" : "mb-7 space-y-3 text-center"}>
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-stone-500">
          <span>{languageLabel.toUpperCase()}</span>
          {statusLabel ? <span>{statusLabel}</span> : null}
          {item.credit_cost && item.credit_cost > 0 ? (
            <span>{item.credit_cost} credits</span>
          ) : (
            <span>Vrij toegankelijk</span>
          )}
        </div>

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
    </article>
  );
}
