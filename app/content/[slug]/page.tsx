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
    <article className="max-w-3xl mx-auto py-12">
      <h1 className="text-4xl font-semibold mb-6">
        {item.title}
      </h1>

      {item.featured_image_url ? (
        <Image
          src={item.featured_image_url}
          alt={item.featured_image_alt || item.title || t.featuredImageAlt}
          width={1200}
          height={630}
          unoptimized
          className="w-full h-auto rounded-lg border object-cover mb-6"
        />
      ) : null}

      {item.body && (
        <div
          className="prose prose-lg mb-10"
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
