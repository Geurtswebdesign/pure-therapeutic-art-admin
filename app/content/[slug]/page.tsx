import { notFound } from "next/navigation";
import {
  getPrimaryCategoryForContentItem,
  getPublishedContentBySlug,
  getPublishedBlocks,
  getThemeNavigationForContentItem,
} from "@/lib/content/public-queries";
import PublicContentArticle from "@/components/content/PublicContentArticle";
import ContentProgressCard from "@/components/content/ContentProgressCard";
import ProtectedReaderShell from "@/components/content/ProtectedReaderShell";
import { hasAccess } from "@/lib/unlock/hasAccess";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import ContentLockout from "@/components/content/ContentLockout";
import { getBalanceByScope } from "@/lib/users/getBalanceByScope";
import { getContentAccessScope } from "@/lib/content/access";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { isLegalContentMetadata } from "@/lib/content/legal-content";
import {
  getUserContentProgress,
  isContentProgressStorageReady,
} from "@/lib/content/progress";
import { toContentProgressSnapshot } from "@/lib/content/progress-types";
import { stripRichText } from "@/lib/content/stripRichText";
import { extractFirstPdfSourceFromHtml } from "@/lib/content/pdf-links";
import { isPdfContentItem } from "@/lib/content/item-types";
import PdfViewerScreen from "@/components/content/PdfViewerScreen";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  async function loadSupplementaryContext(contentItemId: string) {
    const [categoryResult, themeNavigationResult] = await Promise.allSettled([
      getPrimaryCategoryForContentItem(contentItemId, language),
      getThemeNavigationForContentItem(contentItemId, language),
    ]);

    return {
      category:
        categoryResult.status === "fulfilled" ? categoryResult.value : null,
      themeNavigation:
        themeNavigationResult.status === "fulfilled"
          ? themeNavigationResult.value
          : null,
    };
  }

  const language = resolveUiLanguage(await getAppLanguage());
  const { slug } = await params;

  const item = await getPublishedContentBySlug(slug, language);
  if (!item) notFound();

  const user = await getCurrentUser();
  const scope = await getContentAccessScope(item.id);

  const requiresUnlock = (item.credit_cost ?? 0) > 0;

  let hasUserAccess = false;

  if (requiresUnlock && user) {
    hasUserAccess = await hasAccess(user.id, item.id);
  }

  if (requiresUnlock && !hasUserAccess) {
    const { category, themeNavigation } = await loadSupplementaryContext(item.id);
    const balance = user ? await getBalanceByScope(user.id, scope) : 0;
    const backHref = themeNavigation
      ? `/content/themas/${themeNavigation.theme.slug}`
      : category
        ? `/content?category=${category.slug}`
        : "/content";

    return (
      <ContentLockout
        item={item}
        balance={balance}
        scope={scope}
        isLoggedIn={!!user}
        language={language}
        backHref={backHref}
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

  const { category, themeNavigation } = await loadSupplementaryContext(item.id);
  const isSeedCategory = Boolean(category?.is_homepage_seed);
  const isLegalContent = isLegalContentMetadata({
    slug: item.slug,
    title: item.title,
    categories: category?.name ? [category.name] : [],
  });
  const backHref = themeNavigation
    ? `/content/themas/${themeNavigation.theme.slug}`
    : category
      ? `/content?category=${category.slug}`
      : "/content";

  if (isPdfContentItem(item.item_type)) {
    const pdfSrc =
      extractFirstPdfSourceFromHtml(item.body) ??
      extractFirstPdfSourceFromHtml(item.excerpt);

    if (pdfSrc) {
      const viewer = (
        <PdfViewerScreen
          pdfSrc={pdfSrc}
          language={language}
          backHref={backHref}
        />
      );

      if (scope === "book" && user) {
        return (
          <ProtectedReaderShell watermarkText={user.email ?? user.id}>
            {viewer}
          </ProtectedReaderShell>
        );
      }

      return viewer;
    }
  }

  const blocks = await getPublishedBlocks(item.id);

  const article = (
    <PublicContentArticle
      item={item}
      blocks={blocks}
      language={language}
      isSeedCategory={isSeedCategory}
      themeNavigation={themeNavigation}
      backHref={backHref}
      progressCard={
        user && progressStorageReady && !isLegalContent ? (
          <ContentProgressCard
            contentItemId={item.id}
            initialProgress={toContentProgressSnapshot(userProgress)}
            language={language}
          />
        ) : null
      }
      languageLabel={item.language ?? language}
    />
  );

  if (scope === "book" && user) {
    return (
      <ProtectedReaderShell watermarkText={user.email ?? user.id}>
        {article}
      </ProtectedReaderShell>
    );
  }

  return article;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // ⬅️ OOK HIER

  const language = resolveUiLanguage(await getAppLanguage());
  const item = await getPublishedContentBySlug(slug, language);

  if (!item) return {};
  const description = stripRichText(item.excerpt);

  return {
    title: item.title,
    description,
    openGraph: {
      title: item.title,
      description,
    },
  };
}
