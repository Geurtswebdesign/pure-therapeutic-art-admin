import { notFound, redirect } from "next/navigation";
import PublicAppShell from "@/components/public/PublicAppShell";
import AccountEbookReader from "@/components/account/AccountEbookReader";
import ContentProgressCard from "@/components/content/ContentProgressCard";
import ProtectedReaderShell from "@/components/content/ProtectedReaderShell";
import ContentLockout from "@/components/content/ContentLockout";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getContentAccessScope } from "@/lib/content/access";
import {
  getPrimaryCategoryForContentItem,
  getPublishedBlocks,
  getPublishedContentBySlug,
  getThemeNavigationForContentItem,
} from "@/lib/content/public-queries";
import { getUserContentProgress, isContentProgressStorageReady } from "@/lib/content/progress";
import { toContentProgressSnapshot } from "@/lib/content/progress-types";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { hasAccess } from "@/lib/unlock/hasAccess";
import { getBalanceByScope } from "@/lib/users/getBalanceByScope";
import { isLegalContentMetadata } from "@/lib/content/legal-content";

export default async function AccountEbookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/account");
  }

  const language = resolveUiLanguage(await getAppLanguage());
  const { slug } = await params;
  const item = await getPublishedContentBySlug(slug, language);

  if (!item) {
    notFound();
  }

  const scope = await getContentAccessScope(item.id);
  if (scope !== "book") {
    notFound();
  }

  const requiresUnlock = (item.credit_cost ?? 0) > 0;
  const hasUserAccess = requiresUnlock ? await hasAccess(user.id, item.id) : true;

  if (requiresUnlock && !hasUserAccess) {
    const balance = await getBalanceByScope(user.id, scope);

    return (
      <PublicAppShell
        activeTab="profiel"
        title="EBooks"
        subtitle="Veilig lezen in de app"
      >
        <ContentLockout
          item={item}
          balance={balance}
          scope={scope}
          isLoggedIn
          language={language}
        />
      </PublicAppShell>
    );
  }

  const progressStorageReady = await isContentProgressStorageReady();
  const userProgress = progressStorageReady
    ? await getUserContentProgress(user.id, item.id)
    : null;

  const [blocks, category, themeNavigation] = await Promise.all([
    getPublishedBlocks(item.id),
    getPrimaryCategoryForContentItem(item.id),
    getThemeNavigationForContentItem(item.id, language),
  ]);

  const isLegalContent = isLegalContentMetadata({
    slug: item.slug,
    title: item.title,
    categories: category?.name ? [category.name] : [],
  });

  return (
    <PublicAppShell
      activeTab="profiel"
      title="EBooks"
      subtitle="Veilig lezen in de app"
    >
      <ProtectedReaderShell watermarkText={user.email ?? user.id}>
        <AccountEbookReader
          item={item}
          blocks={blocks}
          themeNavigation={themeNavigation}
          progressCard={
            progressStorageReady && !isLegalContent ? (
              <ContentProgressCard
                contentItemId={item.id}
                initialProgress={toContentProgressSnapshot(userProgress)}
                language={language}
              />
            ) : null
          }
          language={language}
        />
      </ProtectedReaderShell>
    </PublicAppShell>
  );
}
