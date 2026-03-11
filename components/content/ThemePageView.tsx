import Link from "next/link";
import type { ThemePageDetail, ThemePageItem, ThemePageSection } from "@/lib/content/theme-queries";

function getLanguageLabel(language: string | null) {
  return language ? language.toUpperCase() : "CONTENT";
}

function getAccessLabel(creditCost: number | null) {
  return creditCost && creditCost > 0 ? `${creditCost} credits` : "Vrij";
}

function getSectionGridClass(section: ThemePageSection) {
  if (section.layoutStyle === "list") {
    return "space-y-3";
  }

  return "grid gap-3";
}

function getItemCardClass(section: ThemePageSection, item: ThemePageItem) {
  if (section.layoutStyle === "list") {
    return "flex items-start justify-between gap-3 rounded-[1.35rem] border border-stone-200 bg-[#fcfaf7] p-4";
  }

  if (section.layoutStyle === "featured" && item.featured) {
    return "rounded-[1.6rem] border border-[#d9c7b4] bg-[linear-gradient(180deg,#fff8ef_0%,#f7ecdf_100%)] p-5 shadow-sm";
  }

  return "rounded-[1.35rem] border border-stone-200 bg-white p-4 shadow-sm";
}

function ThemeSectionItemCard({
  section,
  item,
}: {
  section: ThemePageSection;
  item: ThemePageItem;
}) {
  return (
    <Link href={item.href} className={`${getItemCardClass(section, item)} group block`}>
      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-stone-500">
        <span>{getLanguageLabel(item.language)}</span>
        <span>{getAccessLabel(item.creditCost)}</span>
      </div>

      <div className="mt-3">
        <h3
          className={
            section.layoutStyle === "featured" && item.featured
              ? "font-serif text-2xl leading-tight text-stone-950"
              : "text-base font-semibold leading-snug text-stone-950"
          }
        >
          {item.title}
        </h3>

        {item.excerpt ? (
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {item.excerpt}
          </p>
        ) : null}
      </div>

      <div className="mt-4 text-sm font-medium text-stone-900">
        Open item
      </div>
    </Link>
  );
}

export default function ThemePageView({
  theme,
}: {
  theme: ThemePageDetail;
}) {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-[linear-gradient(180deg,#fffaf2_0%,#f7eee3_100%)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-stone-500">
          <span>{theme.eyebrow || "Thema"}</span>
          {theme.primaryCategory ? <span>{theme.primaryCategory.name}</span> : null}
        </div>

        <h1 className="mt-3 font-serif text-4xl leading-tight text-stone-950">
          {theme.title}
        </h1>

        {theme.description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
            {theme.description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-stone-600">
          <span className="rounded-full border border-stone-200 bg-white/70 px-3 py-1">
            {theme.sectionCount} secties
          </span>
          <span className="rounded-full border border-stone-200 bg-white/70 px-3 py-1">
            {theme.itemCount} gekoppelde items
          </span>
          <Link
            href="/content"
            className="rounded-full border border-stone-200 bg-white px-3 py-1 text-stone-800"
          >
            Alle content
          </Link>
        </div>
      </section>

      {theme.sections.length ? (
        <nav className="flex flex-wrap gap-2">
          {theme.sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.slug}`}
              className="rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
            >
              {section.title}
            </a>
          ))}
        </nav>
      ) : null}

      {theme.sections.map((section) => (
        <section
          key={section.id}
          id={section.slug}
          className="rounded-[1.75rem] border border-stone-200 bg-white/85 p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl leading-tight text-stone-950">
                {section.title}
              </h2>
              {section.description ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                  {section.description}
                </p>
              ) : null}
            </div>

            <div className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
              {section.items.length} items
            </div>
          </div>

          {section.items.length ? (
            <div className={`mt-5 ${getSectionGridClass(section)}`}>
              {section.items.map((item) => (
                <ThemeSectionItemCard key={item.id} section={section} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[1.25rem] border border-dashed border-stone-300 bg-[#faf7f3] p-5 text-sm leading-6 text-stone-600">
              Aan deze sectie zijn nog geen gepubliceerde items gekoppeld.
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
