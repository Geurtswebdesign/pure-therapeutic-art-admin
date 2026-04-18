import Image from "next/image";
import Link from "next/link";
import ThemePageView from "@/components/content/ThemePageView";
import ThemePageCard from "@/components/content/ThemePageCard";
import HistoryBackButton from "@/components/public/HistoryBackButton";
import { getHomepageCategories } from "@/lib/content/public-queries";
import { getCategoryStyle } from "@/lib/content/categoryStyles";
import {
  getPublishedThemePageBySlug,
  getPublishedThemePages,
} from "@/lib/content/theme-queries";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import { getAppMessages } from "@/lib/i18n/appMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getPublicAppMessages } from "@/lib/i18n/publicAppMessages";
import { getTranslatedCategoryName } from "@/lib/i18n/categoryTranslations";

type SearchParams = {
  category?: string | string[];
};

function isSeedCategory(category: { is_homepage_seed?: boolean | null }) {
  return Boolean(category.is_homepage_seed);
}

function formatCategoryLabel(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function getSafeHomepageCategories(preferredLanguage?: string) {
  try {
    return await getHomepageCategories(200, { preferredLanguage });
  } catch (error) {
    console.error("[ContentIndexPage] categories", error);
    return [];
  }
}

export default async function ContentIndexPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const language = resolveUiLanguage(await getAppLanguage());
  const app = getAppMessages(language);
  const publicT = getPublicAppMessages(language);
  const params = await searchParams;
  const categorySlug = Array.isArray(params?.category)
    ? params?.category[0]
    : params?.category;
  const categories = await getSafeHomepageCategories(language);
  const activeCategory = categorySlug
    ? categories.find((category) => category.slug === categorySlug) ?? null
    : null;
  const categoryLabel =
    activeCategory?.name ||
    (categorySlug
      ? getTranslatedCategoryName(
          categorySlug,
          language,
          formatCategoryLabel(categorySlug)
        )
      : null);
  const showingSeedCategory = Boolean(activeCategory && isSeedCategory(activeCategory));
  const showingRegularCategory = Boolean(activeCategory && !isSeedCategory(activeCategory));
  const themes = activeCategory
    ? await getPublishedThemePages({
        includeChildren: true,
        preferredLanguage: language,
      })
    : [];
  const rootCategories = categories
    .filter((category) => !category.parent_id && isSeedCategory(category))
    .sort((a, b) => a.sort_order - b.sort_order);
  const childCategories = activeCategory
    ? categories
        .filter((category) => category.parent_id === activeCategory.id)
        .sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const categoryThemes = activeCategory
    ? themes.filter((theme) => theme.primaryCategory?.id === activeCategory.id)
    : [];
  const inlineTheme =
    activeCategory && !childCategories.length && categoryThemes.length === 1
      ? await getPublishedThemePageBySlug(categoryThemes[0].slug, language)
      : null;

  if (inlineTheme) {
    return <ThemePageView language={language} theme={inlineTheme} />;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-stone-900">
            {categoryLabel ? `${categoryLabel}` : app.home.viewContent}
          </h1>
          <p className="text-sm leading-6 text-stone-600">
            {!categorySlug
              ? app.home.subtitle
              : showingSeedCategory
                ? activeCategory?.description || publicT.content.chooseRegularCategory
                : activeCategory?.description || publicT.content.chooseTheme}
          </p>
          {categorySlug ? (
            <HistoryBackButton
              className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
            >
              {publicT.content.back}
            </HistoryBackButton>
          ) : null}
        </div>
      </section>

      {!categorySlug ? (
        rootCategories.length ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rootCategories.map((category) => {
              const style = getCategoryStyle(category.slug);
              return (
                <Link
                  key={category.id}
                  href={`/content?category=${category.slug}`}
                  className={`group rounded-[2rem] p-6 text-center shadow-sm transition hover:-translate-y-0.5 ${style.cardClass}`}
                >
                  <div className="relative mx-auto mb-5 h-40 w-40">
                    {category.featured_image_url ? (
                      <Image
                        src={category.featured_image_url}
                        alt={category.featured_image_alt || category.name}
                        width={160}
                        height={160}
                        unoptimized
                        className="h-40 w-40 rounded-full object-cover shadow-[0_10px_28px_rgba(18,20,26,0.14)]"
                      />
                    ) : (
                      <div
                        className={`h-40 w-40 rounded-full shadow-[0_10px_28px_rgba(18,20,26,0.14)] ${style.orbClass}`}
                      />
                    )}
                  </div>

                  <h2 className="text-[2rem] font-semibold leading-tight text-[#1f2f43]">
                    {category.name}
                  </h2>

                  <p className="mt-3 line-clamp-3 text-[1.65rem] leading-[1.45] text-[#31445c]">
                    {category.description || publicT.content.seedFallbackDescription}
                  </p>
                </Link>
              );
            })}
          </section>
        ) : (
          <section className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white/70 p-10 text-center text-stone-600">
            {publicT.content.noSeedCategories}
          </section>
        )
      ) : (
        <div className="space-y-8">
          {childCategories.length ? (
            <section className="grid grid-cols-2 gap-3">
              {childCategories.map((category) => {
                const style = getCategoryStyle(category.slug);
                const isSeed = isSeedCategory(category);
                return (
                  <Link
                    key={category.id}
                    href={`/content?category=${category.slug}`}
                    className={
                      isSeed
                        ? `group rounded-[2rem] p-6 text-center shadow-sm transition hover:-translate-y-0.5 ${style.cardClass}`
                        : "group rounded-[1.25rem] border border-stone-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5"
                    }
                  >
                    {isSeed ? (
                      <>
                        <div className="relative mx-auto mb-5 h-40 w-40">
                          {category.featured_image_url ? (
                            <Image
                              src={category.featured_image_url}
                              alt={category.featured_image_alt || category.name}
                              width={160}
                              height={160}
                              unoptimized
                              className="h-40 w-40 rounded-full object-cover shadow-[0_10px_28px_rgba(18,20,26,0.14)]"
                            />
                          ) : (
                            <div
                              className={`h-40 w-40 rounded-full shadow-[0_10px_28px_rgba(18,20,26,0.14)] ${style.orbClass}`}
                            />
                          )}
                        </div>

                        <h2 className="text-[2rem] font-semibold leading-tight text-[#1f2f43]">
                          {category.name}
                        </h2>

                        <p className="mt-3 line-clamp-3 text-[1.65rem] leading-[1.45] text-[#31445c]">
                          {category.description || publicT.content.regularFallbackDescription}
                        </p>
                      </>
                    ) : (
                      <h2 className="text-base font-semibold leading-tight text-stone-900">
                        {category.name}
                      </h2>
                    )}
                  </Link>
                );
              })}
            </section>
          ) : null}

          {categoryThemes.length ? (
            <section className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold text-stone-900">
                  {publicT.content.themesTitle}
                </h2>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {publicT.content.themesSubtitle}
                </p>
              </div>

              <div className="grid gap-4">
                {categoryThemes.map((theme) => (
                  <ThemePageCard key={theme.id} language={language} theme={theme} />
                ))}
              </div>
            </section>
          ) : null}

          {!childCategories.length && !categoryThemes.length ? (
            <section className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white/70 p-10 text-center text-stone-600">
              {showingRegularCategory
                ? publicT.content.noThemes
                : publicT.content.noLevelContent}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
