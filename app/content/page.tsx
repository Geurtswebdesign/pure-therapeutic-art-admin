import Image from "next/image";
import Link from "next/link";
import { getPublishedContent } from "@/lib/content/public-queries";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { getAppMessages } from "@/lib/i18n/appMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getPublicBranding } from "@/lib/settings/public";

type SearchParams = {
  category?: string | string[];
};

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
  const branding = await getPublicBranding();
  const params = await searchParams;
  const categorySlug = Array.isArray(params?.category)
    ? params?.category[0]
    : params?.category;
  const categoryLabel = categorySlug ? formatCategoryLabel(categorySlug) : null;
  const items = await getPublishedContent(categorySlug);

  return (
    <div className="space-y-10">
      <section className="rounded-[2rem] border border-stone-200 bg-white/85 p-8 shadow-[0_24px_60px_rgba(28,25,23,0.08)] backdrop-blur md:p-10">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs uppercase tracking-[0.24em] text-stone-600">
            {branding.siteName}
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
            {categoryLabel ? `Categorie: ${categoryLabel}` : app.home.viewContent}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-stone-600 md:text-lg">
            {categorySlug
              ? "Je ziet nu alle gepubliceerde content binnen deze categorie."
              : app.home.subtitle}
          </p>
          {categorySlug ? (
            <Link
              href="/content"
              className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
            >
              Toon alle content
            </Link>
          ) : null}
        </div>
      </section>

      {items.length ? (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const href = item.language ? `/${item.language}/${item.slug}` : `/content/${item.slug}`;
            return (
              <article
                key={item.id}
                className="group overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white shadow-[0_20px_40px_rgba(28,25,23,0.06)] transition-transform duration-200 hover:-translate-y-1"
              >
                <Link href={href} className="block">
                  <div className="aspect-[16/10] bg-stone-100">
                    {item.featured_image_url ? (
                      <Image
                        src={item.featured_image_url}
                        alt={item.featured_image_alt || item.title}
                        width={1200}
                        height={750}
                        unoptimized
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full items-end bg-[radial-gradient(circle_at_top_left,#d6c2b8_0%,#efe7df_42%,#f7f4ef_100%)] p-6">
                        <span className="rounded-full border border-stone-300/70 bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.24em] text-stone-600">
                          {item.credit_cost && item.credit_cost > 0 ? `${item.credit_cost} credits` : "Open"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 p-6">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.2em] text-stone-500">
                        {(item.language || language).toUpperCase()}
                      </span>
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600">
                        {item.credit_cost && item.credit_cost > 0 ? `${item.credit_cost} credits` : "Vrij"}
                      </span>
                    </div>

                    <h2 className="text-2xl font-semibold leading-tight text-stone-900">
                      {item.title}
                    </h2>

                    <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-stone-600">
                      {item.excerpt || app.home.subtitle}
                    </p>

                    <span className="inline-flex items-center text-sm font-medium text-stone-900">
                      Lees verder
                    </span>
                  </div>
                </Link>
              </article>
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
