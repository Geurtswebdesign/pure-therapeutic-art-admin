import Link from "next/link";

type ThemeProgressCardView = {
  id: string;
  title: string;
  progressPercent: number;
  progressText: string;
  metaText: string;
  statusText: string;
  chaptersLabel: string;
  chapterCountLabel: string;
  continueHref: string | null;
  continueLabel: string;
  themeHref: string | null;
  themeLabel: string;
  openByDefault?: boolean;
  chapters: Array<{
    id: string;
    title: string;
    href: string | null;
    statusText: string;
    metaText: string;
  }>;
};

export default function ThemeProgressGrid({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: ThemeProgressCardView[];
}) {
  return (
    <div className="rounded-xl bg-white px-4 py-4">
      <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
        {title}
      </h4>

      {items.length ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {items.map((item) => (
            <details
              key={item.id}
              className="group overflow-hidden rounded-xl border border-[#eadfd4] bg-[#fcf8f4]"
              open={item.openByDefault}
            >
              <summary className="list-none px-4 py-4 marker:hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-stone-900">{item.title}</div>
                    <div className="mt-1 text-xs text-stone-500">{item.metaText}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 rounded-full bg-[#f7f0e9] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-700">
                      {item.statusText}
                    </span>
                    <span className="text-lg leading-none text-stone-400 transition group-open:rotate-45">
                      +
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-2 overflow-hidden rounded-full bg-[#eadfd4]">
                    <div
                      className="h-full rounded-full bg-[#b64040] transition-all"
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-2 text-sm text-stone-600">{item.progressText}</div>
                </div>

              </summary>

              <div className="border-t border-[#eadfd4] bg-white/60 px-4 py-4">
                <div className="mb-4 flex flex-wrap gap-2">
                  {item.continueHref ? (
                    <Link
                      href={item.continueHref}
                      className="inline-flex min-w-0 items-center rounded-full bg-[#b64040] px-4 py-2 text-sm font-medium text-white"
                    >
                      <span className="truncate">{item.continueLabel}</span>
                    </Link>
                  ) : null}

                  {item.themeHref ? (
                    <Link
                      href={item.themeHref}
                      className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800"
                    >
                      {item.themeLabel}
                    </Link>
                  ) : null}
                </div>

                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    {item.chaptersLabel}
                  </div>
                  <div className="text-xs text-stone-500">{item.chapterCountLabel}</div>
                </div>

                <div className="space-y-2">
                  {item.chapters.map((chapter) =>
                    chapter.href ? (
                      <Link
                        key={chapter.id}
                        href={chapter.href}
                        className="block rounded-xl border border-[#eadfd4] bg-white px-4 py-3 transition hover:border-[#d8c6b8]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-stone-900">
                              {chapter.title}
                            </div>
                            <div className="mt-1 text-xs text-stone-500">
                              {chapter.metaText}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full bg-[#f7f0e9] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-700">
                            {chapter.statusText}
                          </span>
                        </div>
                      </Link>
                    ) : (
                      <div
                        key={chapter.id}
                        className="rounded-xl border border-[#eadfd4] bg-white px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-stone-900">
                              {chapter.title}
                            </div>
                            <div className="mt-1 text-xs text-stone-500">
                              {chapter.metaText}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full bg-[#f7f0e9] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-700">
                            {chapter.statusText}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-stone-500">{emptyText}</p>
      )}
    </div>
  );
}
