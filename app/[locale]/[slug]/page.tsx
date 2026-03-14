// Public localized content page renderer
// Supports published content + admin-only preview mode (Optie A)

import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import ContentLayout from "@/components/content/ContentLayout";
import PublicContentArticle from "@/components/content/PublicContentArticle";
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

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  /* -------------------------------------------------
   * 1️⃣ Check gebruiker + preview permissie
   * ------------------------------------------------- */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin =
    user?.app_metadata?.role === "admin" ||
    user?.user_metadata?.role === "admin";

  const isPreview = preview === "1" && isAdmin;

  /* -------------------------------------------------
   * 2️⃣ Content item ophalen (incl. body)
   * ------------------------------------------------- */
  const { data: item, error: itemError } = await supabase
    .from("content_items")
    .select("id, title, body, status, language, credit_cost, excerpt, featured_image_url, featured_image_alt")
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

  /* -------------------------------------------------
   * 5️⃣ Render (IDENTIEK aan live)
   * ------------------------------------------------- */
  void logServerEvent({
    eventName: isPreview ? "content_preview_opened" : "content_viewed",
    eventCategory: "content",
    eventLabel: item.id,
    path: `/${locale}/${slug}`,
  });

  return (
    <ContentLayout isPreview={isPreview}>
      <PublicContentArticle
        item={item}
        blocks={blocks}
        isSeedCategory={isSeedCategory}
        themeNavigation={themeNavigation}
        languageLabel={locale}
        statusLabel={isPreview ? item.status : null}
      />
    </ContentLayout>
  );
}
