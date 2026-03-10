import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/branding/logo.png";
import PublicBlockRenderer from "@/components/content/PublicBlockRenderer";
import { normalizeImages } from "@/lib/content/normalizeHtml";
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";
import { getPublicBranding } from "@/lib/settings/public";
import type { ContentBlock } from "@/lib/content/types";

type Props = {
  item: {
    title: string;
    excerpt: string | null;
    featured_image_url: string | null;
    featured_image_alt: string | null;
    body?: string | null;
  };
  category?: {
    name?: string | null;
    description?: string | null;
    slug?: string | null;
  } | null;
  blocks?: ContentBlock[];
  language: UiLanguage;
  backHref?: string;
  backLabel?: string;
};

export default async function CompactContentArticle({
  item,
  category,
  blocks = [],
  language,
  backHref,
  backLabel = "Terug",
}: Props) {
  const t = getAppMessages(language).metadata;
  const branding = await getPublicBranding();

  return (
    <article className="mx-auto max-w-xl rounded-[1.75rem] border border-[#e4d8cb] bg-[#f8f3ed] px-5 py-6 shadow-sm sm:px-7">
      {backHref ? (
        <Link
          href={backHref}
          className="mb-5 inline-flex items-center rounded-full border border-stone-300 bg-white/70 px-4 py-2 text-sm text-stone-700"
        >
          {backLabel}
        </Link>
      ) : null}

      <div className="mb-6 flex items-start gap-3">
        {branding.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt={`${branding.siteName} logo`}
            className="h-[42px] w-[42px] object-contain"
          />
        ) : (
          <Image
            src={logo}
            alt="Pure Grief and Therapeutic ART"
            width={42}
            height={42}
            priority
          />
        )}
        <p className="max-w-[220px] font-serif text-[15px] leading-tight text-stone-700">
          {branding.siteName || "Pure Grief and Therapeutic ART"}
        </p>
      </div>

      <header className="mb-7 text-center">
        {category?.name ? (
          <h1 className="font-serif text-[2rem] leading-tight text-stone-950 sm:text-[2.3rem]">
            {category.name}
          </h1>
        ) : null}

        {category?.description ? (
          <p className="mt-1 text-xs italic text-stone-500">
            {category.description}
          </p>
        ) : null}

        <h2 className="mt-4 font-serif text-[1.7rem] leading-tight text-stone-950 sm:text-[2rem]">
          {item.title}
        </h2>
      </header>

      {item.excerpt ? (
        <p className="mb-5 text-sm leading-6 text-stone-800">{item.excerpt}</p>
      ) : null}

      {item.body ? (
        <div
          className="prose prose-sm mb-8 max-w-none prose-headings:font-serif prose-headings:text-stone-900 prose-p:text-stone-800 prose-li:text-stone-800 prose-strong:text-stone-900 prose-a:text-stone-900"
          dangerouslySetInnerHTML={{
            __html: normalizeImages(item.body),
          }}
        />
      ) : null}

      {item.featured_image_url ? (
        <Image
          src={item.featured_image_url}
          alt={item.featured_image_alt || item.title || t.featuredImageAlt}
          width={1200}
          height={630}
          unoptimized
          className="mb-8 h-auto w-full rounded-[1rem] border border-[#dbcdbf] object-cover"
        />
      ) : null}

      {blocks.length ? (
        <div className="space-y-6">
          <PublicBlockRenderer blocks={blocks} />
        </div>
      ) : null}
    </article>
  );
}
