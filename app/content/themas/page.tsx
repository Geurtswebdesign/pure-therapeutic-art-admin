import ThemePageCard from "@/components/content/ThemePageCard";
import { getPublishedThemePages } from "@/lib/content/theme-queries";

export default async function ThemePagesIndex() {
  const themes = await getPublishedThemePages();

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-stone-200 bg-[linear-gradient(180deg,#fdf8f1_0%,#f4eadf_100%)] p-5 shadow-sm">
        <div className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
          Thema-overzicht
        </div>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-stone-950">
          Samengestelde routes
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Hier ordenen we content niet alleen op categorie, maar op volgorde,
          nadruk en samenhang.
        </p>
      </section>

      {themes.length ? (
        <section className="grid gap-4">
          {themes.map((theme) => (
            <ThemePageCard key={theme.id} theme={theme} />
          ))}
        </section>
      ) : (
        <section className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white/70 p-6 text-sm leading-6 text-stone-600">
          Er staan nog geen gepubliceerde themapagina&apos;s klaar.
        </section>
      )}
    </div>
  );
}
