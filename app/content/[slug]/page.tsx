import { notFound } from "next/navigation";
import Image from "next/image";
import {
  getPublishedContentBySlug,
  getPublishedBlocks,
} from "@/lib/content/public-queries";
import PublicBlockRenderer from "@/components/content/PublicBlockRenderer";
import { normalizeImages } from "@/lib/content/normalizeHtml";
import { hasAccess } from "@/lib/unlock/hasAccess";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import ContentLockout from "@/components/content/ContentLockout";
import { getBalanceByScope } from "@/lib/users/getBalanceByScope";
import { getContentAccessScope } from "@/lib/content/access";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const language = resolveUiLanguage(await getPrimaryLanguage());
  const t = getAppMessages(language).metadata;
  const { slug } = await params;

  const item = await getPublishedContentBySlug(slug);
  if (!item) notFound();

  const user = await getCurrentUser();
  const scope = await getContentAccessScope(item.id);

  const requiresUnlock = item.credit_cost > 0;

  let hasUserAccess = false;

  if (requiresUnlock && user) {
    hasUserAccess = await hasAccess(user.id, item.id);
  }

  if (requiresUnlock && !hasUserAccess) {
    const balance = user ? await getBalanceByScope(user.id, scope) : 0;

    return (
      <ContentLockout
        item={item}
        balance={balance}
        scope={scope}
        isLoggedIn={!!user}
        language={language}
      />
    );
  }

  const blocks = await getPublishedBlocks(item.id);

  return (
    <article className="mx-auto max-w-4xl rounded-[2rem] border border-stone-200 bg-white/85 p-6 py-12 shadow-[0_24px_60px_rgba(28,25,23,0.08)] backdrop-blur sm:p-8 lg:p-10">
      <header className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-stone-500">
          <span>{language.toUpperCase()}</span>
          {item.credit_cost && item.credit_cost > 0 ? (
            <span>{item.credit_cost} credits</span>
          ) : (
            <span>Vrij toegankelijk</span>
          )}
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
          {item.title}
        </h1>

        {item.excerpt ? (
          <p className="max-w-3xl text-lg leading-8 text-stone-600">
            {item.excerpt}
          </p>
        ) : null}
      </header>

      {item.featured_image_url ? (
        <Image
          src={item.featured_image_url}
          alt={item.featured_image_alt || item.title || t.featuredImageAlt}
          width={1200}
          height={630}
          unoptimized
          className="mb-8 h-auto w-full rounded-[1.5rem] border border-stone-200 object-cover"
        />
      ) : null}

      {item.body && (
        <div
          className="prose mb-10 max-w-none prose-headings:text-stone-900 prose-p:text-stone-700 prose-strong:text-stone-900 prose-a:text-stone-900 lg:prose-lg"
          dangerouslySetInnerHTML={{
            __html: normalizeImages(item.body),
          }}
        />
      )}

      <div className="space-y-8">
        <PublicBlockRenderer blocks={blocks} />
      </div>
    </article>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // ⬅️ OOK HIER

  const item = await getPublishedContentBySlug(slug);

  if (!item) return {};

  return {
    title: item.title,
    description: item.excerpt ?? "",
    openGraph: {
      title: item.title,
      description: item.excerpt ?? "",
    },
  };
}
