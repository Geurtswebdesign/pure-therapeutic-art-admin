import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/branding/logo.png";
import LockedView from "@/components/content/LockedView";
import type { ContentAccessScope } from "@/lib/content/access";
import type { UiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";
import { normalizeImages } from "@/lib/content/normalizeHtml";
import { getPublicBranding } from "@/lib/settings/public";

type Props = {
  item: {
    id: string;
    title: string;
    excerpt: string | null;
    body?: string | null;
    featured_image_url: string | null;
    featured_image_alt: string | null;
    credit_cost: number | null;
  };
  balance: number;
  scope: ContentAccessScope;
  isLoggedIn: boolean;
  wrapInPageContainer?: boolean;
  language: UiLanguage;
  compactVariant?: boolean;
  category?: {
    name?: string | null;
    description?: string | null;
  } | null;
  backHref?: string;
};

export default async function ContentLockout({
  item,
  balance,
  scope,
  isLoggedIn,
  language,
  wrapInPageContainer = true,
  compactVariant = false,
  category,
  backHref,
}: Props) {
  const t = getAppMessages(language).metadata;
  const branding = await getPublicBranding();
  const content = (
    <article
      className={
        compactVariant
          ? "space-y-5 rounded-[1.5rem] border border-[#e4d8cb] bg-[#f8f3ed] p-4 shadow-sm"
          : "lockout-container space-y-5"
      }
    >
      {compactVariant && backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center self-start rounded-full border border-stone-300 bg-white/70 px-4 py-2 text-sm text-stone-700"
        >
          Terug
        </Link>
      ) : null}

      <header className="flex items-start gap-3">
        {branding.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt={`${branding.siteName} logo`}
            className={compactVariant ? "h-[42px] w-[42px] object-contain" : "h-[46px] w-[46px] object-contain"}
          />
        ) : (
          <Image
            src={logo}
            alt="Pure Grief and Therapeutic ART"
            width={compactVariant ? 42 : 46}
            height={compactVariant ? 42 : 46}
            priority
          />
        )}
        <div>
          <h3 className={compactVariant ? "text-xl font-semibold leading-tight text-stone-900" : "lockout-brand-title"}>
            {branding.siteName || "Pure Grief and Therapeutic ART"}
          </h3>
        </div>
      </header>

      {compactVariant ? (
        <div className="space-y-3 text-center">
          {category?.name ? (
            <h1 className="font-serif text-[2rem] leading-tight text-stone-950">
              {category.name}
            </h1>
          ) : null}
          {category?.description ? (
            <p className="text-xs italic text-stone-500">{category.description}</p>
          ) : null}
          <h2 className="font-serif text-[1.7rem] leading-tight text-stone-950">
            {item.title}
          </h2>
        </div>
      ) : (
        <h1 className="lockout-title">{item.title}</h1>
      )}

      {item.featured_image_url ? (
        <Image
          src={item.featured_image_url}
          alt={item.featured_image_alt || item.title || t.featuredImageAlt}
          width={1200}
          height={630}
          unoptimized
          className="w-full h-auto rounded border object-cover"
        />
      ) : null}

      {item.excerpt ? (
        <p className={compactVariant ? "text-sm leading-6 text-stone-700" : "lockout-copy"}>
          {item.excerpt}
        </p>
      ) : null}

      {compactVariant && item.body ? (
        <div className="relative overflow-hidden rounded-[1rem] border border-[#e4d8cb] bg-white/40 px-4 py-4">
          <div
            className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-stone-900 prose-p:text-stone-800 prose-li:text-stone-800 prose-strong:text-stone-900 prose-a:text-stone-900"
            dangerouslySetInnerHTML={{
              __html: normalizeImages(item.body),
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#f8f3ed]" />
        </div>
      ) : null}

      <div className={compactVariant ? "rounded-[1rem] border border-stone-300 bg-[#efefee] p-4 shadow-sm" : ""}>
        <LockedView
          contentId={item.id}
          cost={item.credit_cost ?? 0}
          balance={balance}
          scope={scope}
          isLoggedIn={isLoggedIn}
          language={language}
          compactVariant={compactVariant}
        />
      </div>
    </article>
  );

  if (!wrapInPageContainer) return content;

  return <div className="lockout-page">{content}</div>;
}
