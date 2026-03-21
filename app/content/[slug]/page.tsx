import { notFound } from "next/navigation";
import {
  getPrimaryCategoryForContentItem,
  getPublishedContentBySlug,
  getPublishedBlocks,
  getThemeNavigationForContentItem,
} from "@/lib/content/public-queries";
import PublicContentArticle from "@/components/content/PublicContentArticle";
import ContentProgressCard from "@/components/content/ContentProgressCard";
import { hasAccess } from "@/lib/unlock/hasAccess";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import ContentLockout from "@/components/content/ContentLockout";
import { getBalanceByScope } from "@/lib/users/getBalanceByScope";
import { getContentAccessScope } from "@/lib/content/access";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import {
  getUserContentProgress,
  isContentProgressStorageReady,
} from "@/lib/content/progress";
import { toContentProgressSnapshot } from "@/lib/content/progress-types";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const language = resolveUiLanguage(await getPrimaryLanguage());
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

  const progressStorageReady = user
    ? await isContentProgressStorageReady()
    : false;
  const userProgress =
    user && progressStorageReady
      ? await getUserContentProgress(user.id, item.id)
      : null;

  const [blocks, category, themeNavigation] = await Promise.all([
    getPublishedBlocks(item.id),
    getPrimaryCategoryForContentItem(item.id),
    getThemeNavigationForContentItem(item.id),
  ]);
  const isSeedCategory = Boolean(category?.is_homepage_seed);

  return (
    <PublicContentArticle
      item={item}
      blocks={blocks}
      isSeedCategory={isSeedCategory}
      themeNavigation={themeNavigation}
      progressCard={
        user && progressStorageReady ? (
          <ContentProgressCard
            contentItemId={item.id}
            initialProgress={toContentProgressSnapshot(userProgress)}
            language={language}
          />
        ) : null
      }
      languageLabel={language}
    />
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
