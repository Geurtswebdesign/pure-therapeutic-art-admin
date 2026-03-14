import Link from "next/link";
import HistoryBackButton from "@/components/public/HistoryBackButton";
import type { ThemePageDetail } from "@/lib/content/theme-queries";

export default function ThemePageView({
  theme,
}: {
  theme: ThemePageDetail;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="rounded-[1.75rem] border border-[#e4d8cb] bg-[#f8f3ed] p-5 shadow-sm sm:p-7">
        <header className="mt-6">
          <h1 className="font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
            {theme.title}
          </h1>
          {theme.description ? (
            <p className="mt-3 text-sm italic leading-6 text-stone-600">
              {theme.description}
            </p>
          ) : null}
        </header>
        <div className="flex items-start justify-between gap-3">
          <HistoryBackButton className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700">
            Terug
          </HistoryBackButton>
        </div>
        {theme.childThemes.length ? (
          <div className="mt-6 border-t border-[#ddd0c4] pt-5">
            <div className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
              Subthema&apos;s
            </div>
            <ol className="mt-3 space-y-2 text-stone-900">
              {theme.childThemes.map((childTheme, index) => (
                <li key={childTheme.id}>
                  <Link
                    href={`/content/themas/${childTheme.slug}`}
                    className="text-base font-medium hover:underline"
                  >
                    {index + 1}. {childTheme.title}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>

      <section className="rounded-[1.75rem] border border-[#e4d8cb] bg-white p-5 shadow-sm sm:p-7">
        {theme.sections.length ? (
          <ol className="space-y-7">
            {theme.sections.map((section) => (
              <li key={section.id}>
                {section.description ? (
                  <p className="mt-1 text-sm italic leading-6 text-stone-600">
                    {section.description}
                  </p>
                ) : null}

                {section.items.length ? (
                  <ol
                    type="a"
                    className="mt-4 list-outside space-y-2.5 pl-6 text-lg leading-8 text-stone-900 marker:font-semibold"
                  >
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <Link href={item.href} className="block py-1 hover:underline">
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 pl-5 text-sm leading-6 text-stone-500">
                    Aan deze sectie zijn nog geen gepubliceerde items gekoppeld.
                  </p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <div className="text-sm leading-6 text-stone-600">
            Dit thema heeft nog geen gepubliceerde secties.
          </div>
        )}
      </section>
    </div>
  );
}
