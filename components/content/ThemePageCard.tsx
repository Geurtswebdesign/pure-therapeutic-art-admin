import Image from "next/image";
import Link from "next/link";
import type { ThemePageSummary } from "@/lib/content/theme-queries";

export default function ThemePageCard({
  theme,
}: {
  theme: ThemePageSummary;
}) {
  return (
    <Link
      href={`/content/themas/${theme.slug}`}
      className="group rounded-[1.5rem] border border-[#e4d8cb] bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(41,29,21,0.08)] sm:p-5"
    >
      <div className="flex items-start gap-4">
        {theme.heroImageUrl ? (
          <Image
            src={theme.heroImageUrl}
            alt={theme.heroImageAlt || theme.title}
            width={240}
            height={240}
            unoptimized
            className="h-20 w-20 shrink-0 rounded-[1.25rem] object-cover sm:h-24 sm:w-24"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.25rem] bg-[#f3ece4] text-[11px] uppercase tracking-[0.22em] text-stone-500 sm:h-24 sm:w-24">
            Thema
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-stone-500">
            <span>{theme.eyebrow || "Thema"}</span>
            {theme.primaryCategory ? <span>{theme.primaryCategory.name}</span> : null}
            {theme.childThemeCount ? <span>{theme.childThemeCount} subthema&apos;s</span> : null}
          </div>

          <h2 className="mt-2 font-serif text-2xl leading-tight text-stone-950">
            {theme.title}
          </h2>

          {theme.description ? (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">
              {theme.description}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-600">
            <span className="rounded-full bg-stone-100 px-3 py-1">
              {theme.sectionCount} secties
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1">
              {theme.itemCount} items
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
