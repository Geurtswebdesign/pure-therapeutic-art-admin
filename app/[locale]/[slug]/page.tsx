import { notFound } from "next/navigation";
import ContentLayout from "@/components/content/ContentLayout";
import PublicContentArticle from "@/components/content/PublicContentArticle";
import ContentProgressCard from "@/components/content/ContentProgressCard";
import ProtectedReaderShell from "@/components/content/ProtectedReaderShell";
import ContentLockout from "@/components/content/ContentLockout";
import { parseContentBlocks } from "@/lib/content/renderer";
import { hasAccess } from "@/lib/unlock/hasAccess";
import { getBalanceByScope } from "@/lib/users/getBalanceByScope";
import { getContentAccessScope } from "@/lib/content/access";
import { normalizeSupabaseStorageUrl } from "@/lib/images/supabaseStorageUrl";
import {
  getPrimaryCategoryForContentItem,
  getPublishedBlocks,
  getPublishedContentBySlug,
  getThemeNavigationForContentItem,
} from "@/lib/content/public-queries";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { logServerEvent } from "@/lib/analytics/server";
import { isLegalContentMetadata } from "@/lib/content/legal-content";
import { createClient, getUserOrNull } from "@/lib/supabase/server";
import {
  getUserContentProgress,
  isContentProgressStorageReady,
} from "@/lib/content/progress";
import { toContentProgressSnapshot } from "@/lib/content/progress-types";
import { extractFirstPdfSourceFromHtml } from "@/lib/content/pdf-links";
import { isPdfContentItem } from "@/lib/content/item-types";
import PdfViewerScreen from "@/components/content/PdfViewerScreen";

type PageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
  searchParams: Promise<{
    preview?: string;
  }>;
};

export default async function ContentPage({
  params,
  searchParams,
}: PageProps) {
  const { locale, slug } = await params;
  const language = resolveUiLanguage(locale);
  const { preview } = await searchParams;
  const supabase = await createClient();

  /* -------------------------------------------------
   * 1️⃣ Check gebruiker + preview permissie
   * ------------------------------------------------- */
  const user = await getUserOrNull(supabase);

  const isAdmin =
    user?.app_metadata?.role === "admin" ||
    user?.user_metadata?.role === "admin";

  const isPreview = preview === "1" && isAdmin;

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

  /* -------------------------------------------------
   * 2️⃣ Content item ophalen (incl. body)
   * ------------------------------------------------- */
  const item = isPreview
    ? await (async () => {
        const { data } = await supabase
          .from("content_items")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        return data
          ? {
              ...data,
              featured_image_url: normalizeSupabaseStorageUrl(
                data.featured_image_url
              ),
            }
          : null;
      })()
    : await getPublishedContentBySlug(slug, language);

  if (!item) {
    notFound();
  }

  /* -------------------------------------------------
   * 3️⃣ Status check
   * ------------------------------------------------- */
  // Publiek → alleen published
  if (!isPreview && item.status !== "published") {
    notFound();
  }

  // Preview → draft + published
  if (isPreview && !["draft", "published"].includes(item.status)) {
    notFound();
  }

  /* -------------------------------------------------
   * 3b️⃣ Unlock check (alleen buiten admin-preview)
   * ------------------------------------------------- */
  const requiresUnlock = (item.credit_cost ?? 0) > 0;
  const scope = await getContentAccessScope(item.id);
  let hasUserAccess = false;

  if (!isPreview && requiresUnlock && user) {
    hasUserAccess = await hasAccess(user.id, item.id);
  }

  if (!isPreview && requiresUnlock && !hasUserAccess) {
    const { category, themeNavigation } = await loadSupplementaryContext(item.id);
    const balance = user ? await getBalanceByScope(user.id, scope) : 0;
    const backHref = themeNavigation
      ? `/content/themas/${themeNavigation.theme.slug}`
      : category
        ? `/content?category=${category.slug}`
        : "/content";

    return (
      <ContentLayout isPreview={isPreview}>
        <ContentLockout
          item={item}
          balance={balance}
          scope={scope}
          isLoggedIn={!!user}
          language={language}
          backHref={backHref}
        />
      </ContentLayout>
    );
  }

  const progressStorageReady =
    user && !isPreview ? await isContentProgressStorageReady() : false;
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
      void logServerEvent({
        eventName: isPreview ? "content_preview_opened" : "content_viewed",
        eventCategory: "content",
        eventLabel: item.id,
        path: `/${locale}/${slug}`,
      });

      const viewer = (
        <ContentLayout isPreview={isPreview}>
          <PdfViewerScreen
            pdfSrc={pdfSrc}
            language={language}
            backHref={backHref}
          />
        </ContentLayout>
      );

      if (!isPreview && scope === "book" && user) {
        return (
          <ProtectedReaderShell watermarkText={user.email ?? user.id}>
            {viewer}
          </ProtectedReaderShell>
        );
      }

      return viewer;
    }
  }

  /* -------------------------------------------------
   * 4️⃣ Blocks ophalen
   * ------------------------------------------------- */
  const rawBlocks = await getPublishedBlocks(item.id);
  const blocks = parseContentBlocks(rawBlocks ?? []);

  /* -------------------------------------------------
   * 5️⃣ Render (IDENTIEK aan live)
   * ------------------------------------------------- */
  void logServerEvent({
    eventName: isPreview ? "content_preview_opened" : "content_viewed",
    eventCategory: "content",
    eventLabel: item.id,
    path: `/${locale}/${slug}`,
  });

  const article = (
    <ContentLayout isPreview={isPreview}>
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
        statusLabel={isPreview ? item.status : null}
      />
    </ContentLayout>
  );

  if (!isPreview && scope === "book" && user) {
    return (
      <ProtectedReaderShell watermarkText={user.email ?? user.id}>
        {article}
      </ProtectedReaderShell>
    );
  }

  return article;
}
