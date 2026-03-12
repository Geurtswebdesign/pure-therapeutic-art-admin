import Image from "next/image";
import logo from "@/assets/branding/logo.png";
import LockedView from "@/components/content/LockedView";
import type { ContentAccessScope } from "@/lib/content/access";
import type { UiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";
import { getPublicBranding } from "@/lib/settings/public";

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
};

export default async function ContentLockout({
  item,
  balance,
  scope,
  isLoggedIn,
  language,
  wrapInPageContainer = true,
}: Props) {
  const t = getAppMessages(language).metadata;
  const content = (
    <article className="lockout-container space-y-5">
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
        <p className="lockout-copy">
          {item.excerpt}
        </p>
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
