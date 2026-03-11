import Image from "next/image";
import LockedView from "@/components/content/LockedView";
import { normalizeImages } from "@/lib/content/normalizeHtml";
import type { ContentAccessScope } from "@/lib/content/access";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Item = {
  id: string;
  title: string | null;
  excerpt?: string | null;
  body?: string | null;
  featured_image_url?: string | null;
  featured_image_alt?: string | null;
  credit_cost?: number | null;
};

export default function LockedContentPreview({
  item,
  balance,
  scope,
  isLoggedIn,
  language,
}: {
  item: Item;
  balance: number;
  scope: ContentAccessScope;
  isLoggedIn: boolean;
  language: UiLanguage;
}) {
  return (
    <article className="mx-auto max-w-2xl rounded-[1.5rem] border border-[#e4d8cb] bg-[#f8f3ed] p-5 shadow-sm sm:p-7">
      <header className="mb-7 space-y-3 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.22em] text-stone-500">
          <span>Vergrendeld</span>
          {item.credit_cost && item.credit_cost > 0 ? <span>{item.credit_cost} credits</span> : null}
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-stone-950">{item.title}</h1>

        {item.excerpt ? (
          <p className="mx-auto max-w-xl text-sm leading-6 text-stone-600">{item.excerpt}</p>
        ) : null}
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

      <section className="relative overflow-hidden rounded-[1.25rem] border border-[#ddcfbf] bg-white/75 p-5">
        <div className="pointer-events-none select-none opacity-75 blur-[3px]" aria-hidden="true">
          {item.body ? (
            <div
              className="prose prose-sm max-h-72 max-w-none overflow-hidden prose-headings:text-stone-900 prose-p:text-stone-700 prose-li:text-stone-700"
              dangerouslySetInnerHTML={{ __html: normalizeImages(item.body) }}
            />
          ) : (
            <div className="space-y-3">
              <div className="h-4 w-11/12 rounded-full bg-stone-200" />
              <div className="h-4 w-full rounded-full bg-stone-200" />
              <div className="h-4 w-10/12 rounded-full bg-stone-200" />
              <div className="h-4 w-9/12 rounded-full bg-stone-200" />
              <div className="h-40 rounded-[1rem] bg-stone-200" />
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#f8f3ed] via-[#f8f3ed]/85 to-transparent" />
      </section>

      <div className="mt-6 rounded-[1.25rem] border border-[#ddcfbf] bg-white p-5 shadow-sm">
        <LockedView
          contentId={item.id}
          cost={item.credit_cost ?? 0}
          balance={balance}
          scope={scope}
          isLoggedIn={isLoggedIn}
          language={language}
        />
      </div>
    </article>
  );
}
