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
      className="group overflow-hidden rounded-[1.75rem] border border-stone-200 bg-white/85 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(41,29,21,0.08)]"
    >
      {theme.heroImageUrl ? (
        <div className="aspect-[16/8] bg-stone-100">
          <Image
            src={theme.heroImageUrl}
            alt={theme.heroImageAlt || theme.title}
            width={1200}
            height={600}
            unoptimized
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-stone-500">
          <span>{theme.eyebrow || "Thema"}</span>
          {theme.primaryCategory ? <span>{theme.primaryCategory.name}</span> : null}
          {theme.childThemeCount ? <span>{theme.childThemeCount} subthema&apos;s</span> : null}
        </div>

        <h2 className="mt-3 font-serif text-2xl leading-tight text-stone-950">
          {theme.title}
        </h2>

        {theme.description ? (
          <p className="mt-3 text-sm leading-6 text-stone-600">
            {theme.description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-stone-600">
          <span className="rounded-full bg-stone-100 px-3 py-1">
            {theme.sectionCount} secties
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1">
            {theme.itemCount} items
          </span>
        </div>
      </div>
    </Link>
  );
}
