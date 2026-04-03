// Public localized content page renderer
// Supports published content + admin-only preview mode (Optie A)

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
import {
  getPrimaryCategoryForContentItem,
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

  /* -------------------------------------------------
   * 2️⃣ Content item ophalen (incl. body)
   * ------------------------------------------------- */
  const { data: item, error: itemError } = await supabase
    .from("content_items")
    .select("id, slug, title, body, status, language, credit_cost, excerpt, featured_image_url, featured_image_alt")
    .eq("slug", slug)
    .eq("language", locale)
    .single();

  if (!item || itemError) {
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
    const balance = user ? await getBalanceByScope(user.id, scope) : 0;

    return (
      <ContentLayout isPreview={isPreview}>
        <ContentLockout
          item={item}
          balance={balance}
          scope={scope}
          isLoggedIn={!!user}
          language={language}
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

  /* -------------------------------------------------
   * 4️⃣ Blocks ophalen
   * ------------------------------------------------- */
  const { data: rawBlocks } = await supabase
    .from("content_blocks")
    .select("type, data, order_index")
    .eq("content_item_id", item.id)
    .order("order_index");

  const blocks = parseContentBlocks(rawBlocks ?? []);
  const [category, themeNavigation] = await Promise.all([
    getPrimaryCategoryForContentItem(item.id),
    getThemeNavigationForContentItem(item.id),
  ]);
  const isSeedCategory = Boolean(category?.is_homepage_seed);
  const isLegalContent = isLegalContentMetadata({
    slug: item.slug,
    title: item.title,
    categories: category?.name ? [category.name] : [],
  });

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
        isSeedCategory={isSeedCategory}
        themeNavigation={themeNavigation}
        progressCard={
          user && progressStorageReady && !isLegalContent ? (
            <ContentProgressCard
              contentItemId={item.id}
              initialProgress={toContentProgressSnapshot(userProgress)}
              language={language}
            />
          ) : null
        }
        languageLabel={locale}
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
