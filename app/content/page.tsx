import Image from "next/image";
import Link from "next/link";
import { getHomepageCategories, getPublishedContent } from "@/lib/content/public-queries";
import {
  isSeedCategorySlug,
} from "@/lib/content/homepageSeedCategories";
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

function isSeedCategory(slug: string) {
  return isSeedCategorySlug(slug);
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
  const categoryLabel = categorySlug ? formatCategoryLabel(categorySlug) : null;
  const [items, categories] = await Promise.all([
    getPublishedContent(categorySlug),
    getHomepageCategories(200),
  ]);
  const rootCategories = categories.filter((category) => !category.parent_id);
  const activeCategory = categorySlug
    ? categories.find((category) => category.slug === categorySlug) ?? null
    : null;
  const childCategories = activeCategory
    ? categories
        .filter((category) => category.parent_id === activeCategory.id)
        .sort((a, b) => a.sort_order - b.sort_order)
    : [];

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">

          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-stone-900">
            {categoryLabel ? `${categoryLabel}` : app.home.viewContent}
          </h1>
          <p className="text-sm leading-6 text-stone-600">
            {categorySlug
              ? (activeCategory?.description || "Je ziet nu alle gepubliceerde content binnen deze categorie.")
              : app.home.subtitle}
          </p>
          {categorySlug ? (
            <Link
              href="/"
              className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
            >
              Terug
            </Link>
          ) : null}
        </div>
      </section>

      {!categorySlug ? (
        rootCategories.length ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rootCategories.map((category) => {
              const style = getCategoryStyle(category.slug);
              const isSeed = isSeedCategory(category.slug);
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

                        <span className="absolute -right-1 top-0 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-[0_6px_16px_rgba(18,20,26,0.16)]">
                          {style.badge}
                        </span>
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
            Er staan nog geen categorieen klaar.
          </section>
        )
      ) : items.length ? (
        categorySlug && activeCategory && !isSeedCategory(activeCategory.slug) ? (
          <section className="rounded-[1.75rem] border border-stone-200 bg-[#f8f3ed] p-5 shadow-sm">
            <h2 className="text-3xl font-semibold text-stone-900">
              {activeCategory.name}
            </h2>
            {activeCategory.description ? (
              <p className="mt-2 text-sm text-stone-600">
                {activeCategory.description}
              </p>
            ) : null}

            <ol className="mt-5 space-y-3 text-stone-900">
              {items.map((item, index) => {
                const href = item.language ? `/${item.language}/${item.slug}` : `/content/${item.slug}`;
                return (
                  <li key={item.id} className="border-b border-stone-200 pb-3 last:border-b-0">
                    <Link href={href} className="text-lg font-medium leading-snug hover:underline">
                      {index + 1}. {item.title}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : (
        <section className="grid grid-cols-2 gap-3">
          {items.map((item) => {
            const href = item.language ? `/${item.language}/${item.slug}` : `/content/${item.slug}`;
            return (
              <article
                key={item.id}
                className="group flex h-full min-h-[280px] flex-col overflow-hidden rounded-[1.5rem] border border-[#e5dbcf] bg-white shadow-[0_12px_30px_rgba(31,24,19,0.08)] transition"
              >
                <Link href={href} className="flex h-full flex-col">
                  <div className="aspect-[16/10] shrink-0 bg-[#f6eee6]">
                    {item.featured_image_url ? (
                      <Image
                        src={item.featured_image_url}
                        alt={item.featured_image_alt || item.title}
                        width={1200}
                        height={750}
                        unoptimized
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                      />
                    ) : (
                      <div className="flex h-full items-end bg-[radial-gradient(circle_at_top_left,#d6c2b8_0%,#efe7df_42%,#f7f4ef_100%)] p-4">
                        <span className="rounded-full border border-stone-300/70 bg-white/85 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-stone-600">
                          {item.credit_cost && item.credit_cost > 0 ? `${item.credit_cost} credits` : "Open"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col space-y-3 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
                        {(item.language || language).toUpperCase()}
                      </span>
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600">
                        {item.credit_cost && item.credit_cost > 0 ? `${item.credit_cost} credits` : "Vrij"}
                      </span>
                    </div>

                    <h2 className="min-h-[56px] text-2xl font-semibold leading-tight text-stone-900">
                      {item.title}
                    </h2>

                    <p className="min-h-[60px] line-clamp-3 text-sm leading-6 text-stone-600">
                      {item.excerpt || app.home.subtitle}
                    </p>

                    <div className="mt-auto pt-1">
                      <span className="inline-flex items-center text-sm font-medium text-stone-900">
                        Lees verder
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </section>
        )
      ) : categorySlug && childCategories.length ? (
        <section className="grid grid-cols-2 gap-3">
          {childCategories.map((category) => {
            const style = getCategoryStyle(category.slug);
            const isSeed = isSeedCategory(category.slug);
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

                      <span className="absolute -right-1 top-0 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-[0_6px_16px_rgba(18,20,26,0.16)]">
                        {style.badge}
                      </span>
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
          Er staat nog geen gepubliceerde content klaar.
        </section>
      )}
    </div>
  );
}
