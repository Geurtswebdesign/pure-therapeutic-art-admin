import Link from "next/link";
import {
  getAdminThemeSummaries,
  type AdminThemeSummary,
} from "@/lib/content/theme-admin";
import {
  getThemeSourceManifest,
  type ThemeSourceEntry,
} from "@/lib/content/theme-source-manifest";
import { getAdminAreaUrl } from "@/lib/site/urls";

type ThemeSortOption =
  | "updated_desc"
  | "updated_asc"
  | "created_desc"
  | "created_asc"
  | "title_asc"
  | "title_desc";

function normalizeThemeSortOption(value: string | undefined): ThemeSortOption {
  switch (value) {
    case "updated_asc":
    case "created_desc":
    case "created_asc":
    case "title_asc":
    case "title_desc":
      return value;
    default:
      return "updated_desc";
  }
}

function getTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function sortThemes(themes: AdminThemeSummary[], sort: ThemeSortOption) {
  const sorted = [...themes];

  sorted.sort((left, right) => {
    if (sort === "title_asc" || sort === "title_desc") {
      const direction = sort === "title_asc" ? 1 : -1;
      const titleCompare = left.title.localeCompare(right.title, "nl");
      if (titleCompare !== 0) {
        return titleCompare * direction;
      }

      return left.slug.localeCompare(right.slug, "nl") * direction;
    }

    const leftTimestamp =
      sort.startsWith("created")
        ? getTimestamp(left.createdAt)
        : getTimestamp(left.updatedAt);
    const rightTimestamp =
      sort.startsWith("created")
        ? getTimestamp(right.createdAt)
        : getTimestamp(right.updatedAt);

    if (leftTimestamp !== rightTimestamp) {
      if (leftTimestamp === null) return 1;
      if (rightTimestamp === null) return -1;
      return sort.endsWith("_asc")
        ? leftTimestamp - rightTimestamp
        : rightTimestamp - leftTimestamp;
    }

    return left.title.localeCompare(right.title, "nl");
  });

  return sorted;
}

function SourceRow({
  entry,
  importedTheme,
}: {
  entry: ThemeSourceEntry;
  importedTheme: AdminThemeSummary | null;
}) {
  return (
    <tr className="border-t border-stone-200">
      <td className="px-3 py-3 align-top">
        <div className="font-medium text-stone-900">{entry.title}</div>
        <div className="text-xs text-stone-500">{entry.folderPath}</div>
      </td>
      <td className="px-3 py-3 align-top text-sm text-stone-600">
        {entry.parentKey || "-"}
      </td>
      <td className="px-3 py-3 align-top text-sm text-stone-600">
        {entry.sections.length || entry.childThemeKeys?.length || 0}
      </td>
      <td className="px-3 py-3 align-top text-sm text-stone-600">
        {entry.imageCount}
      </td>
      <td className="px-3 py-3 align-top text-sm">
        {importedTheme ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">
            Geimporteerd
          </span>
        ) : (
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-700">
            Nog niet gebruikt
          </span>
        )}
      </td>
      <td className="px-3 py-3 align-top text-sm">
        {importedTheme ? (
          <Link
            href={getAdminAreaUrl(`/content/themes/${importedTheme.id}`)}
            className="text-[#2271b1] hover:underline"
          >
            Bewerken
          </Link>
        ) : (
          <Link
            href={getAdminAreaUrl(`/content/themes/new?source=${encodeURIComponent(entry.key)}`)}
            className="text-[#2271b1] hover:underline"
          >
            Nieuw op basis van bron
          </Link>
        )}
      </td>
    </tr>
  );
}

export default async function AdminThemesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const sort = normalizeThemeSortOption(
    Array.isArray(params.sort) ? params.sort[0] : params.sort
  );
  const [themes, manifest] = await Promise.all([
    getAdminThemeSummaries(),
    getThemeSourceManifest(),
  ]);
  const sortedThemes = sortThemes(themes, sort);

  const importedBySourceKey = new Map(
    themes
      .filter((theme) => theme.sourceKey)
      .map((theme) => [theme.sourceKey!, theme])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-950">Themes</h1>
          <p className="mt-1 text-sm text-stone-600">
            Beheer themapagina&apos;s, sections en bronmappen uit de zip-inventaris.
          </p>
        </div>

        <Link
          href={getAdminAreaUrl("/content/themes/new")}
          className="rounded bg-[#2271b1] px-4 py-2 text-sm font-medium text-white hover:bg-[#135e96]"
        >
          Nieuw thema
        </Link>
      </div>

      <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-stone-900">Bestaande themapagina&apos;s</h2>
          <form method="get" className="flex items-center gap-2 text-sm">
            <label htmlFor="theme-sort" className="text-stone-600">
              Sorteren op
            </label>
            <select
              id="theme-sort"
              name="sort"
              defaultValue={sort}
              className="rounded border border-stone-300 px-2 py-1 text-sm"
            >
              <option value="updated_desc">Datum gewijzigd nieuw → oud</option>
              <option value="updated_asc">Datum gewijzigd oud → nieuw</option>
              <option value="created_desc">Datum aangemaakt nieuw → oud</option>
              <option value="created_asc">Datum aangemaakt oud → nieuw</option>
              <option value="title_asc">Titel A-Z</option>
              <option value="title_desc">Titel Z-A</option>
            </select>
            <button
              type="submit"
              className="rounded border border-stone-300 px-3 py-1 text-sm text-stone-700 hover:bg-stone-50"
            >
              Toepassen
            </button>
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="px-3 py-3 font-medium">Titel</th>
                <th className="px-3 py-3 font-medium">Parent</th>
                <th className="px-3 py-3 font-medium">Secties</th>
                <th className="px-3 py-3 font-medium">Items</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Bron</th>
              </tr>
            </thead>
            <tbody>
              {themes.length ? (
                sortedThemes.map((theme) => (
                  <tr key={theme.id} className="border-t border-stone-200">
                    <td className="px-3 py-3 align-top">
                      <Link
                        href={getAdminAreaUrl(`/content/themes/${theme.id}`)}
                        className="font-medium text-[#2271b1] hover:underline"
                      >
                        {theme.title}
                      </Link>
                      <div className="text-xs text-stone-500">/{theme.slug}</div>
                    </td>
                    <td className="px-3 py-3 align-top text-stone-600">
                      {theme.parentTheme?.title || "-"}
                    </td>
                    <td className="px-3 py-3 align-top text-stone-600">
                      {theme.sectionCount}
                    </td>
                    <td className="px-3 py-3 align-top text-stone-600">
                      {theme.itemCount}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs ${
                          theme.isPublished
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-100 text-stone-700"
                        }`}
                      >
                        {theme.isPublished ? "Gepubliceerd" : "Concept"}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top text-xs text-stone-500">
                      {theme.sourceKey || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-sm text-stone-500"
                  >
                    Er zijn nog geen themapagina&apos;s opgeslagen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-stone-900">
            Bronmanifest uit zip
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {manifest.themeCount} bronentries gevonden in {manifest.sourceRoot}.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="px-3 py-3 font-medium">Bron</th>
                <th className="px-3 py-3 font-medium">Parent key</th>
                <th className="px-3 py-3 font-medium">Secties/children</th>
                <th className="px-3 py-3 font-medium">Afbeeldingen</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Actie</th>
              </tr>
            </thead>
            <tbody>
              {manifest.themes.map((entry) => (
                <SourceRow
                  key={entry.key}
                  entry={entry}
                  importedTheme={importedBySourceKey.get(entry.key) ?? null}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
