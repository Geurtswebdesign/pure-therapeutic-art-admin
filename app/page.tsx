import Link from "next/link";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";
import { getHomepageCategories } from "@/lib/content/public-queries";
import PublicAppShell from "@/components/public/PublicAppShell";

export default async function Home() {
  const language = resolveUiLanguage(await getPrimaryLanguage());
  const t = getAppMessages(language).home;
  const categories = await getHomepageCategories(10);
  return (
    <PublicAppShell activeTab="home" subtitle="Rust, groei en troost">
      <section className="space-y-4">
        <div className="rounded-[1.75rem] border border-stone-200 bg-white px-4 py-4 shadow-sm">
          <div className="grid grid-cols-[72px_1fr] gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_top,#c47f62_0%,#b34c42_35%,#7d2f2f_100%)] text-xl font-semibold text-white">
                A
              </div>
              <span className="text-xs text-stone-500">Larisssa</span>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-2xl leading-tight text-stone-950">
                {t.title}
              </h2>
              <p className="text-sm leading-6 text-stone-600">
                {t.subtitle}
              </p>
              <div className="flex gap-2 pt-1">
                <Link
                  className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white"
                  href="/content"
                >
                  Start
                </Link>
                <Link
                  className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-800"
                  href="/login"
                >
                  {t.login}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {categories.length ? (
            categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/content?category=${category.slug}`}
                className="min-h-[116px] rounded-[1.4rem] border border-stone-300 bg-[#ddd9d5] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition hover:-translate-y-0.5 hover:bg-[#d7d1cc]"
              >
                <div className="text-xs font-medium text-stone-500">
                  {index + 1}. Categorie
                </div>
                <div className="mt-2 text-sm font-semibold leading-5 text-stone-900">
                  {category.name}
                </div>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-stone-700">
                  {category.description || category.featuredItem?.title || t.subtitle}
                </p>
                <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-stone-500">
                  {category.featuredItem?.credit_cost && category.featuredItem.credit_cost > 0
                    ? `${category.featuredItem.credit_cost} credits`
                    : "Vrij toegankelijk"}
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-2 rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-stone-600">
              Nog geen content beschikbaar.
            </div>
          )}
        </div>
      </section>
    </PublicAppShell>
  );
}
