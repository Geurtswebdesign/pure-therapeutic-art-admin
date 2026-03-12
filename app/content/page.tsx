import Image from "next/image";
import Link from "next/link";
import ThemePageCard from "@/components/content/ThemePageCard";
import HistoryBackButton from "@/components/public/HistoryBackButton";
import { getHomepageCategories } from "@/lib/content/public-queries";
import { getPublishedThemePages } from "@/lib/content/theme-queries";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { getAppMessages } from "@/lib/i18n/appMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

type SearchParams = {
  category?: string | string[];
};

type CategoryStyle = {
  cardClass: string;
  orbClass: string;
  badge: string;
};

const CATEGORY_STYLE_BY_SLUG: Record<string, CategoryStyle> = {
  gratis: {
    cardClass: "bg-teal-100",
    orbClass: "bg-[radial-gradient(circle_at_30%_30%,#e7fffb_0%,#a7efe4_55%,#67d8c8_100%)]",
    badge: "🎁",
  },
  "cognitie-inzicht": {
    cardClass: "bg-[#e3dbef]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#2c0838_0%,#0e0818_62%,#07060f_100%)]",
    badge: "🧠",
  },
  "emoties-innerlijke-beleving": {
    cardClass: "bg-[#ead8e7]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#f0dede_0%,#d8d8d8_55%,#c2c2c2_100%)]",
    badge: "❤️",
  },
  "gedrag-interactie": {
    cardClass: "bg-[#f2e3c8]",
    orbClass: "bg-[radial-gradient(circle_at_30%_30%,#ffb01f_0%,#ef8b00_48%,#d76d00_100%)]",
    badge: "👥",
  },
  "lichaam-zintuigen": {
    cardClass: "bg-[#cddff0]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#28a6ff_0%,#0a86da_55%,#0471c2_100%)]",
    badge: "🧘",
  },
  "natuur-symbolische-kracht": {
    cardClass: "bg-[#cde8d2]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#cad6c9_0%,#aac2a9_50%,#8faa92_100%)]",
    badge: "🌿",
  },
  "zingeving-ritualen-spiritualiteit": {
    cardClass: "bg-[#e3dbef]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#5f9c62_0%,#2f6840_50%,#1f3f2c_100%)]",
    badge: "🪷",
  },
  "specifieke-doelgroepen-context": {
    cardClass: "bg-[#efe4b8]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#fafafa_0%,#ededed_52%,#d8d8d8_100%)]",
    badge: "🧑‍🤝‍🧑",
  },
};

function getCategoryStyle(slug: string): CategoryStyle {
  return (
    CATEGORY_STYLE_BY_SLUG[slug] ?? {
      cardClass: "bg-[#e8e3ee]",
      orbClass: "bg-[radial-gradient(circle_at_35%_30%,#d7d7d7_0%,#bdbdbd_60%,#a0a0a0_100%)]",
      badge: "✨",
    }
  );
}

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

export default async function ContentIndexPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const language = resolveUiLanguage(await getPrimaryLanguage());
  const app = getAppMessages(language);
  const params = await searchParams;
  const categorySlug = Array.isArray(params?.category)
    ? params?.category[0]
    : params?.category;
  const categories = await getHomepageCategories(200);
  const activeCategory = categorySlug
    ? categories.find((category) => category.slug === categorySlug) ?? null
    : null;
  const categoryLabel = activeCategory?.name || (categorySlug ? formatCategoryLabel(categorySlug) : null);
  const showingSeedCategory = Boolean(activeCategory && isSeedCategory(activeCategory));
  const showingRegularCategory = Boolean(activeCategory && !isSeedCategory(activeCategory));
  const themes = showingRegularCategory ? await getPublishedThemePages() : [];
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
                ? activeCategory?.description || "Kies een gewone categorie binnen deze seed-categorie."
                : activeCategory?.description || "Kies een thema binnen deze categorie."}
          </p>
          {categorySlug ? (
            <HistoryBackButton
              className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
            >
              Terug
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
                    {category.description || "Verken de gewone categorieen binnen dit domein."}
                  </p>
                </Link>
              );
            })}
          </section>
        ) : (
          <section className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white/70 p-10 text-center text-stone-600">
            Er staan nog geen seed-categorieen klaar.
          </section>
        )
      ) : showingSeedCategory && childCategories.length ? (
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
                      {category.description || "Verken thema's en oefeningen binnen deze categorie."}
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
      ) : showingRegularCategory ? (
        categoryThemes.length ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-stone-900">
                Thema&apos;s
              </h2>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                Kies een thema om de werkvormen in vaste volgorde te openen.
              </p>
            </div>

            <div className="grid gap-4">
              {categoryThemes.map((theme) => (
                <ThemePageCard key={theme.id} theme={theme} />
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white/70 p-10 text-center text-stone-600">
            Er staan nog geen gepubliceerde thema&apos;s klaar binnen deze categorie.
          </section>
        )
      ) : categorySlug && childCategories.length ? (
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
                      {category.description || "Verken thema's en oefeningen binnen deze categorie."}
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
      ) : (
        <section className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white/70 p-10 text-center text-stone-600">
          Er staat nog niets klaar binnen dit niveau.
        </section>
      )}
    </div>
  );
}
