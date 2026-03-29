import Image from "next/image";
import LockedView from "@/components/content/LockedView";
import HistoryBackButton from "@/components/public/HistoryBackButton";
import RichTextExcerpt from "@/components/content/RichTextExcerpt";
import type { ContentAccessScope } from "@/lib/content/access";
import type { UiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";

type Props = {
  item: {
    id: string;
    title: string;
    excerpt: string | null;
    featured_image_url: string | null;
    featured_image_alt: string | null;
    credit_cost: number | null;
  };
  balance: number;
  scope: ContentAccessScope;
  isLoggedIn: boolean;
  wrapInPageContainer?: boolean;
  language: UiLanguage;
  backHref?: string;
  backLabel?: string;
};

export default async function ContentLockout({
  item,
  balance,
  scope,
  isLoggedIn,
  language,
  wrapInPageContainer = true,
  backHref = "/content",
  backLabel = "Terug",
}: Props) {
  const t = getAppMessages(language).metadata;
  const content = (
    <article className="lockout-container space-y-5">
      <div className="flex items-center justify-between gap-3">
        <HistoryBackButton
          fallbackHref={backHref}
          className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800"
        >
          {backLabel}
        </HistoryBackButton>
      </div>

      <h1 className="lockout-title">
        {item.title}
      </h1>

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
        <RichTextExcerpt
          html={item.excerpt}
          className="lockout-copy [&_p]:m-0 [&_p+p]:mt-3 [&_strong]:text-stone-800 [&_a]:text-stone-800"
        />
      ) : null}

      <LockedView
        contentId={item.id}
        cost={item.credit_cost ?? 0}
        balance={balance}
        scope={scope}
        isLoggedIn={isLoggedIn}
        language={language}
      />
    </article>
  );

  if (!wrapInPageContainer) return content;

  return <div className="lockout-page">{content}</div>;
}
