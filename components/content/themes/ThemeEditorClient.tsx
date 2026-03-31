"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  deleteThemePage,
  saveThemePage,
} from "@/app/admin/content/themes/actions";
import ClassicTextEditor from "@/components/content/ClassicTextEditor";
import ThemeMediaPickerDialog from "@/components/content/themes/ThemeMediaPickerDialog";
import { resolveAdminBrowserHref } from "@/lib/site/admin-client-paths";
import type {
  ThemeCategoryOption,
  ThemeContentOption,
  ThemeEditorData,
  ThemePageDraft,
  ThemeSectionDraft,
  ThemeSectionItemDraft,
  ThemeOption,
} from "@/lib/content/theme-admin";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeLookupValue(text: string | null | undefined) {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "")
    .replace(/-+/g, "");
}

function createSection(sortOrder: number): ThemeSectionDraft {
  return {
    id: null,
    slug: "",
    title: "",
    description: "",
    layoutStyle: "grid",
    sectionImageUrl: "",
    sectionImageAlt: "",
    sectionImagePosition: "none",
    sortOrder,
    items: [],
  };
}

function createItem(sortOrder: number): ThemeSectionItemDraft {
  return {
    id: null,
    contentItemId: "",
    sourceTitle: "",
    customTitle: "",
    customExcerpt: "",
    featured: false,
    overrideImageUrl: "",
    overrideImageAlt: "",
    overrideImagePosition: "inherit",
    sortOrder,
  };
}

function normalizeItems(items: ThemeSectionItemDraft[]) {
  return items.map((item, index) => ({
    ...item,
    sortOrder: (index + 1) * 10,
  }));
}

function normalizeSections(sections: ThemeSectionDraft[]) {
  return sections.map((section, index) => ({
    ...section,
    sortOrder: (index + 1) * 10,
    items: normalizeItems(section.items),
  }));
}

function normalizeDraftOrdering(draft: ThemePageDraft): ThemePageDraft {
  return {
    ...draft,
    sections: normalizeSections(draft.sections),
  };
}

function getDuplicateItemError(
  draft: ThemePageDraft,
  contentOptionById: Map<string, ThemeContentOption>
) {
  for (const section of draft.sections) {
    const seenContentItemIds = new Set<string>();

    for (const item of section.items) {
      const contentItemId = item.contentItemId.trim();
      if (!contentItemId) continue;

      if (seenContentItemIds.has(contentItemId)) {
        const contentItemTitle =
          contentOptionById.get(contentItemId)?.title || item.customTitle || item.sourceTitle;
        const sectionTitle = section.title || section.slug || "zonder titel";
        return `Het content-item "${contentItemTitle}" staat meer dan één keer in de sectie "${sectionTitle}".`;
      }

      seenContentItemIds.add(contentItemId);
    }
  }

  return null;
}

function getDuplicateSectionSlugError(draft: ThemePageDraft) {
  const seenSectionSlugs = new Map<string, string>();

  for (const section of draft.sections) {
    if (!section.title.trim()) continue;

    const sectionSlug = (section.slug || slugify(section.title)).trim();
    if (!sectionSlug) {
      return "Elke sectie die je bewaart heeft een slug nodig.";
    }

    const existingTitle = seenSectionSlugs.get(sectionSlug);
    if (existingTitle) {
      return `De secties "${existingTitle}" en "${section.title}" hebben dezelfde slug "${sectionSlug}". Geef elke sectie een unieke slug.`;
    }

    seenSectionSlugs.set(sectionSlug, section.title);
  }

  return null;
}

function moveArrayItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function getMatchRank(
  sourceValue: string,
  option: ThemeContentOption
): number | null {
  const title = normalizeLookupValue(option.title);
  const slug = normalizeLookupValue(option.slug);

  if (!sourceValue) return null;
  if (title === sourceValue) return 0;
  if (slug === sourceValue) return 1;
  if (title.startsWith(sourceValue)) return 2;
  if (slug.startsWith(sourceValue)) return 3;
  if (title.includes(sourceValue)) return 4;
  if (slug.includes(sourceValue)) return 5;
  return null;
}

function findBestContentMatch(
  sourceTitle: string,
  contentOptions: ThemeContentOption[],
  usedIds: Set<string>
) {
  const sourceValue = normalizeLookupValue(sourceTitle);
  if (!sourceValue) return null;

  let bestMatch: ThemeContentOption | null = null;
  let bestRank: number | null = null;

  for (const option of contentOptions) {
    if (usedIds.has(option.id)) continue;

    const rank = getMatchRank(sourceValue, option);
    if (rank === null) continue;

    if (bestMatch === null || bestRank === null) {
      bestMatch = option;
      bestRank = rank;
      continue;
    }

    const currentStatusRank = option.status === "published" ? 0 : 1;
    const bestStatusRank = bestMatch.status === "published" ? 0 : 1;

    if (
      rank < bestRank ||
      (rank === bestRank && currentStatusRank < bestStatusRank) ||
      (rank === bestRank &&
        currentStatusRank === bestStatusRank &&
        option.title.localeCompare(bestMatch.title, "nl") < 0)
    ) {
      bestMatch = option;
      bestRank = rank;
    }
  }

  return bestMatch;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-stone-700">
      {children}
    </label>
  );
}

function ImagePreview({
  alt,
  url,
}: {
  alt: string;
  url: string;
}) {
  if (!url) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
      <Image
        src={url}
        alt={alt || "Geselecteerde afbeelding"}
        width={800}
        height={500}
        unoptimized
        className="aspect-[16/9] w-full object-cover"
      />
    </div>
  );
}

export default function ThemeEditorClient({
  initialData,
}: {
  initialData: ThemeEditorData;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [draft, setDraft] = useState<ThemePageDraft>(initialData.draft);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mediaTarget, setMediaTarget] = useState<
    | { kind: "hero" }
    | { kind: "section"; sectionIndex: number }
    | { itemIndex: number; kind: "item"; sectionIndex: number }
    | null
  >(null);
  const contentOptionById = new Map(
    initialData.contentOptions.map((option) => [option.id, option])
  );
  const selectedCategoryOption =
    initialData.categoryOptions.find(
      (option) => option.id === draft.primaryCategoryTermId
    ) ?? null;
  const themeEditorUploadScope = draft.id
    ? `theme-pages/${draft.id}`
    : "theme-pages/draft";

  function updateDraft(patch: Partial<ThemePageDraft>) {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      if (patch.title !== undefined && !prev.slug) {
        next.slug = slugify(patch.title);
      }
      return next;
    });
  }

  function updateSection(sectionIndex: number, patch: Partial<ThemeSectionDraft>) {
    setDraft((prev) => {
      const sections = [...prev.sections];
      const current = sections[sectionIndex];
      if (!current) return prev;
      const next = { ...current, ...patch };
      if (patch.title !== undefined && !current.slug) {
        next.slug = slugify(patch.title);
      }
      sections[sectionIndex] = next;
      return { ...prev, sections };
    });
  }

  function updateItem(
    sectionIndex: number,
    itemIndex: number,
    patch: Partial<ThemeSectionItemDraft>
  ) {
    setDraft((prev) => {
      const sections = [...prev.sections];
      const section = sections[sectionIndex];
      if (!section) return prev;
      const items = [...section.items];
      const current = items[itemIndex];
      if (!current) return prev;
      items[itemIndex] = { ...current, ...patch };
      sections[sectionIndex] = { ...section, items };
      return { ...prev, sections };
    });
  }

  function addSection() {
    setDraft((prev) =>
      normalizeDraftOrdering({
        ...prev,
        sections: [...prev.sections, createSection((prev.sections.length + 1) * 10)],
      })
    );
  }

  function removeSection(sectionIndex: number) {
    setDraft((prev) =>
      normalizeDraftOrdering({
        ...prev,
        sections: prev.sections.filter((_, index) => index !== sectionIndex),
      })
    );
  }

  function addItem(sectionIndex: number) {
    setDraft((prev) => {
      const sections = [...prev.sections];
      const section = sections[sectionIndex];
      if (!section) return prev;
      sections[sectionIndex] = {
        ...section,
        items: [...section.items, createItem((section.items.length + 1) * 10)],
      };
      return normalizeDraftOrdering({ ...prev, sections });
    });
  }

  function removeItem(sectionIndex: number, itemIndex: number) {
    setDraft((prev) => {
      const sections = [...prev.sections];
      const section = sections[sectionIndex];
      if (!section) return prev;
      sections[sectionIndex] = {
        ...section,
        items: section.items.filter((_, index) => index !== itemIndex),
      };
      return normalizeDraftOrdering({ ...prev, sections });
    });
  }

  function moveSection(sectionIndex: number, direction: -1 | 1) {
    setDraft((prev) =>
      normalizeDraftOrdering({
        ...prev,
        sections: moveArrayItem(prev.sections, sectionIndex, sectionIndex + direction),
      })
    );
  }

  function moveItem(
    sectionIndex: number,
    itemIndex: number,
    direction: -1 | 1
  ) {
    setDraft((prev) => {
      const sections = [...prev.sections];
      const section = sections[sectionIndex];
      if (!section) return prev;

      sections[sectionIndex] = {
        ...section,
        items: moveArrayItem(section.items, itemIndex, itemIndex + direction),
      };

      return normalizeDraftOrdering({ ...prev, sections });
    });
  }

  function autoLinkContent(sectionIndex?: number) {
    setFeedback(null);
    setError(null);

    let matchedCount = 0;

    setDraft((prev) => {
      const usedIds = new Set(
        prev.sections.flatMap((section) =>
          section.items
            .map((item) => item.contentItemId)
            .filter((contentItemId): contentItemId is string => Boolean(contentItemId))
        )
      );

      const sections = prev.sections.map((section, currentSectionIndex) => {
        if (sectionIndex !== undefined && currentSectionIndex !== sectionIndex) {
          return section;
        }

        const items = section.items.map((item) => {
          if (item.contentItemId || !item.sourceTitle.trim()) {
            return item;
          }

          const bestMatch = findBestContentMatch(
            item.sourceTitle,
            initialData.contentOptions,
            usedIds
          );

          if (!bestMatch) {
            return item;
          }

          usedIds.add(bestMatch.id);
          matchedCount += 1;

          return {
            ...item,
            contentItemId: bestMatch.id,
          };
        });

        return {
          ...section,
          items,
        };
      });

      return normalizeDraftOrdering({
        ...prev,
        sections,
      });
    });

    setFeedback(
      matchedCount
        ? `${matchedCount} content-item${matchedCount === 1 ? "" : "s"} automatisch gekoppeld.`
        : "Geen extra matches gevonden."
    );
  }

  function handlePickedMedia(media: { alt: string; url: string }) {
    if (!mediaTarget) return;

    if (mediaTarget.kind === "hero") {
      updateDraft({
        heroImageAlt: draft.heroImageAlt || media.alt,
        heroImageUrl: media.url,
      });
      return;
    }

    if (mediaTarget.kind === "section") {
      const section = draft.sections[mediaTarget.sectionIndex];
      if (!section) return;
      updateSection(mediaTarget.sectionIndex, {
        sectionImageAlt: section.sectionImageAlt || media.alt || section.title,
        sectionImageUrl: media.url,
      });
      return;
    }

    const section = draft.sections[mediaTarget.sectionIndex];
    const item = section?.items[mediaTarget.itemIndex];
    if (!section || !item) return;

    updateItem(mediaTarget.sectionIndex, mediaTarget.itemIndex, {
      overrideImageAlt:
        item.overrideImageAlt || media.alt || item.sourceTitle || item.customTitle,
      overrideImageUrl: media.url,
    });
  }

  function handleSave() {
    setFeedback(null);
    setError(null);
    const nextDraft = normalizeDraftOrdering(draft);
    const duplicateItemError = getDuplicateItemError(nextDraft, contentOptionById);
    const duplicateSectionSlugError = getDuplicateSectionSlugError(nextDraft);

    if (duplicateItemError) {
      setError(duplicateItemError);
      return;
    }

    if (duplicateSectionSlugError) {
      setError(duplicateSectionSlugError);
      return;
    }

    setDraft(nextDraft);

    startTransition(() => {
      void saveThemePage(nextDraft)
        .then((result) => {
          if (!result.ok) {
            setError(result.error);
            return;
          }

          setFeedback("Thema opgeslagen.");
          if (!nextDraft.id) {
            router.replace(
              resolveAdminBrowserHref(
                pathname,
                `/admin/content/themes/${result.id}`
              )
            );
          } else {
            router.refresh();
          }
        })
        .catch((saveError) => {
          setError(
            saveError instanceof Error ? saveError.message : "Opslaan mislukt."
          );
        });
    });
  }

  function handleDelete() {
    if (!draft.id) return;
    const confirmed = window.confirm("Weet je zeker dat je dit thema wilt verwijderen?");
    if (!confirmed) return;

    setFeedback(null);
    setError(null);

    startTransition(() => {
      void deleteThemePage(draft.id!, draft.slug)
        .then((result) => {
          if (!result.ok) {
            setError(result.error);
            return;
          }

          router.push(resolveAdminBrowserHref(pathname, "/admin/content/themes"));
          router.refresh();
        })
        .catch((deleteError) => {
          setError(
            deleteError instanceof Error
              ? deleteError.message
              : "Verwijderen mislukt."
          );
        });
    });
  }

  const linkedItemsCount = draft.sections.reduce(
    (count, section) =>
      count + section.items.filter((item) => Boolean(item.contentItemId)).length,
    0
  );
  const unlinkedItemsCount = draft.sections.reduce(
    (count, section) =>
      count + section.items.filter((item) => !item.contentItemId && item.sourceTitle).length,
    0
  );
  const sourceSections = initialData.sourceEntry?.sections ?? [];

  function getSourceSection(section: ThemeSectionDraft) {
    return (
      sourceSections.find((candidate) => {
        if (candidate.slug && section.slug) {
          return candidate.slug === section.slug;
        }

        return (
          normalizeLookupValue(candidate.title) === normalizeLookupValue(section.title)
        );
      }) ?? null
    );
  }

  function getSourceItem(
    section: ThemeSectionDraft,
    item: ThemeSectionItemDraft,
    itemIndex: number
  ) {
    const sourceSection = getSourceSection(section);
    if (!sourceSection) return null;

    if (item.sourceTitle) {
      return (
        sourceSection.items.find(
          (candidate) =>
            normalizeLookupValue(candidate.title) ===
            normalizeLookupValue(item.sourceTitle)
        ) ?? null
      );
    }

    return sourceSection.items[itemIndex] ?? null;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-950">
            {draft.id ? draft.title || "Thema bewerken" : "Nieuw thema"}
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Bouw themapagina&apos;s met secties, beeldposities en gekoppelde content-items.
          </p>
        </div>

        <div className="flex gap-2">
          {draft.id ? (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded border border-red-300 px-4 py-2 text-sm text-red-700"
              disabled={isPending}
            >
              Verwijderen
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-[#2271b1] px-4 py-2 text-sm font-medium text-white hover:bg-[#135e96] disabled:opacity-60"
            disabled={isPending}
          >
            {isPending ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </div>

      {feedback ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {initialData.sourceEntry ? (
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">Bronvoorstel</h2>
          <p className="mt-2 text-sm text-stone-600">
            Bronmap: <span className="font-medium text-stone-800">{initialData.sourceEntry.folderPath}</span>
          </p>
          {initialData.sourceEntry.docxPath ? (
            <p className="mt-1 text-sm text-stone-600">
              Applicatiebestand: <span className="font-medium text-stone-800">{initialData.sourceEntry.docxPath}</span>
            </p>
          ) : null}
          {initialData.sourceEntry.childThemeKeys?.length ? (
            <p className="mt-2 text-sm text-stone-600">
              Deze bron bevat {initialData.sourceEntry.childThemeKeys.length} subthema&apos;s.
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-600">
            <span className="rounded-full bg-stone-100 px-3 py-1">
              {draft.sections.length} secties
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1">
              {linkedItemsCount} gekoppeld
            </span>
            {unlinkedItemsCount ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
                {unlinkedItemsCount} nog niet gekoppeld
              </span>
            ) : null}
          </div>
          {unlinkedItemsCount ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => autoLinkContent()}
                className="rounded border border-stone-300 px-4 py-2 text-sm text-stone-800"
              >
                Koppel beste matches automatisch
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">Thema-instellingen</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel>Titel</FieldLabel>
            <input
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            />
          </div>
          <div>
            <FieldLabel>Slug</FieldLabel>
            <input
              value={draft.slug}
              onChange={(event) => updateDraft({ slug: event.target.value })}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            />
          </div>
          <div>
            <FieldLabel>Eyebrow</FieldLabel>
            <input
              value={draft.eyebrow}
              onChange={(event) => updateDraft({ eyebrow: event.target.value })}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            />
          </div>
          <div>
            <FieldLabel>Bronsleutel</FieldLabel>
            <input
              value={draft.sourceKey}
              onChange={(event) => updateDraft({ sourceKey: event.target.value })}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            />
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Beschrijving</FieldLabel>
            <div className="mt-1 overflow-hidden rounded border border-stone-300">
              <ClassicTextEditor
                contentItemId={`${themeEditorUploadScope}/description`}
                value={draft.description}
                onChange={(value) => updateDraft({ description: value })}
                height={260}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Parent-thema</FieldLabel>
            <select
              value={draft.parentThemePageId}
              onChange={(event) =>
                updateDraft({ parentThemePageId: event.target.value })
              }
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            >
              <option value="">Geen parent</option>
              {initialData.parentThemeOptions.map((option: ThemeOption) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>Primaire categorie</FieldLabel>
            <select
              value={draft.primaryCategoryTermId}
              onChange={(event) =>
                updateDraft({ primaryCategoryTermId: event.target.value })
              }
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            >
              <option value="">Geen categorie</option>
              {initialData.categoryOptions.map((option: ThemeCategoryOption) => (
                <option
                  key={option.id}
                  value={option.id}
                  disabled={
                    (option.isHomepageSeed || !option.parentId) &&
                    option.id !== draft.primaryCategoryTermId
                  }
                >
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs leading-5 text-stone-500">
              Koppel thema&apos;s aan een gewone categorie onder een seed-categorie.
              {selectedCategoryOption?.isHomepageSeed || !selectedCategoryOption?.parentId
                ? " De huidige keuze staat nog op seed-niveau en moet worden omgezet."
                : ""}
            </p>
          </div>
          <div>
            <FieldLabel>Hero-afbeelding URL</FieldLabel>
            <input
              value={draft.heroImageUrl}
              onChange={(event) =>
                updateDraft({ heroImageUrl: event.target.value })
              }
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMediaTarget({ kind: "hero" })}
                className="rounded border border-stone-300 px-3 py-2 text-sm"
              >
                Kies uit mediatheek
              </button>
              {draft.heroImageUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    updateDraft({ heroImageAlt: "", heroImageUrl: "" })
                  }
                  className="rounded border border-stone-300 px-3 py-2 text-sm"
                >
                  Verwijderen
                </button>
              ) : null}
            </div>
            {initialData.sourceEntry?.suggestedHeroImagePath ? (
              <p className="mt-1 text-xs leading-5 text-stone-500">
                Bronafbeelding uit zip:{" "}
                <span className="font-medium text-stone-700">
                  {initialData.sourceEntry.suggestedHeroImagePath}
                </span>
                . Upload dit beeld eerst naar mediaopslag en zet daarna de publieke URL hierboven.
              </p>
            ) : null}
            <ImagePreview alt={draft.heroImageAlt} url={draft.heroImageUrl} />
          </div>
          <div>
            <FieldLabel>Hero-afbeelding alt</FieldLabel>
            <input
              value={draft.heroImageAlt}
              onChange={(event) =>
                updateDraft({ heroImageAlt: event.target.value })
              }
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            />
          </div>
          <div>
            <FieldLabel>Hero-positie</FieldLabel>
            <select
              value={draft.heroImagePosition}
              onChange={(event) =>
                updateDraft({
                  heroImagePosition: event.target.value as ThemePageDraft["heroImagePosition"],
                })
              }
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            >
              <option value="top">Boven</option>
              <option value="right">Rechts</option>
              <option value="background">Achtergrond</option>
            </select>
          </div>
          <div>
            <FieldLabel>Volgorde</FieldLabel>
            <input
              type="number"
              value={draft.sortOrder}
              onChange={(event) =>
                updateDraft({ sortOrder: Number(event.target.value) })
              }
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="theme-published"
              type="checkbox"
              checked={draft.isPublished}
              onChange={(event) =>
                updateDraft({ isPublished: event.target.checked })
              }
            />
            <label htmlFor="theme-published" className="text-sm text-stone-700">
              Gepubliceerd
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Secties</h2>
            <p className="text-sm text-stone-600">
              Voeg secties toe en koppel per sectie de juiste content-items.
            </p>
          </div>
          <button
            type="button"
            onClick={addSection}
            className="rounded border border-stone-300 px-4 py-2 text-sm"
          >
            Sectie toevoegen
          </button>
        </div>

        {draft.sections.map((section, sectionIndex) => {
          const unresolvedCount = section.items.filter(
            (item) => !item.contentItemId && item.sourceTitle
          ).length;
          const sourceSection = getSourceSection(section);

          return (
            <section
              key={`${section.id ?? "new"}-${sectionIndex}`}
              className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-stone-900">
                    {section.title || `Sectie ${sectionIndex + 1}`}
                  </h3>
                  {unresolvedCount ? (
                    <p className="mt-1 text-xs text-amber-700">
                      {unresolvedCount} bronitems hebben nog geen gekoppelde content.
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {unresolvedCount ? (
                    <button
                      type="button"
                      onClick={() => autoLinkContent(sectionIndex)}
                      className="rounded border border-stone-300 px-3 py-1.5 text-sm"
                    >
                      Auto-koppelen
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => moveSection(sectionIndex, -1)}
                    disabled={sectionIndex === 0}
                    className="rounded border border-stone-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Omhoog
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(sectionIndex, 1)}
                    disabled={sectionIndex === draft.sections.length - 1}
                    className="rounded border border-stone-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Omlaag
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSection(sectionIndex)}
                    className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700"
                  >
                    Verwijderen
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Titel</FieldLabel>
                  <input
                    value={section.title}
                    onChange={(event) =>
                      updateSection(sectionIndex, { title: event.target.value })
                    }
                    className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                  />
                </div>
                <div>
                  <FieldLabel>Slug</FieldLabel>
                  <input
                    value={section.slug}
                    onChange={(event) =>
                      updateSection(sectionIndex, { slug: event.target.value })
                    }
                    className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>Beschrijving</FieldLabel>
                  <div className="mt-1 overflow-hidden rounded border border-stone-300">
                    <ClassicTextEditor
                      contentItemId={`${themeEditorUploadScope}/sections/${sectionIndex + 1}`}
                      value={section.description}
                      onChange={(value) =>
                        updateSection(sectionIndex, {
                          description: value,
                        })
                      }
                      height={220}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Layout</FieldLabel>
                  <select
                    value={section.layoutStyle}
                    onChange={(event) =>
                      updateSection(sectionIndex, {
                        layoutStyle: event.target.value as ThemeSectionDraft["layoutStyle"],
                      })
                    }
                    className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                  >
                    <option value="featured">Featured</option>
                    <option value="grid">Grid</option>
                    <option value="list">List</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Positie</FieldLabel>
                  <div className="mt-1 rounded border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                    Sectie {sectionIndex + 1} van {draft.sections.length}
                  </div>
                </div>
                <div>
                  <FieldLabel>Sectie-afbeelding URL</FieldLabel>
                  <input
                    value={section.sectionImageUrl}
                    onChange={(event) =>
                      updateSection(sectionIndex, {
                        sectionImageUrl: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMediaTarget({ kind: "section", sectionIndex })
                      }
                      className="rounded border border-stone-300 px-3 py-2 text-sm"
                    >
                      Kies uit mediatheek
                    </button>
                    {section.sectionImageUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          updateSection(sectionIndex, {
                            sectionImageAlt: "",
                            sectionImageUrl: "",
                          })
                        }
                        className="rounded border border-stone-300 px-3 py-2 text-sm"
                      >
                        Verwijderen
                      </button>
                    ) : null}
                  </div>
                  {sourceSection?.suggestedSectionImagePath ? (
                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      Bronafbeelding uit zip:{" "}
                      <span className="font-medium text-stone-700">
                        {sourceSection.suggestedSectionImagePath}
                      </span>
                    </p>
                  ) : null}
                  <ImagePreview
                    alt={section.sectionImageAlt}
                    url={section.sectionImageUrl}
                  />
                </div>
                <div>
                  <FieldLabel>Sectie-afbeelding alt</FieldLabel>
                  <input
                    value={section.sectionImageAlt}
                    onChange={(event) =>
                      updateSection(sectionIndex, {
                        sectionImageAlt: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                  />
                </div>
                <div>
                  <FieldLabel>Sectie-afbeelding positie</FieldLabel>
                  <select
                    value={section.sectionImagePosition}
                    onChange={(event) =>
                      updateSection(sectionIndex, {
                        sectionImagePosition:
                          event.target.value as ThemeSectionDraft["sectionImagePosition"],
                      })
                    }
                    className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                  >
                    <option value="none">Geen</option>
                    <option value="top">Boven</option>
                    <option value="left">Links</option>
                    <option value="right">Rechts</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
                    Sectie-items
                  </h4>
                  <button
                    type="button"
                    onClick={() => addItem(sectionIndex)}
                    className="rounded border border-stone-300 px-3 py-1.5 text-sm"
                  >
                    Item toevoegen
                  </button>
                </div>

                {section.items.length ? (
                  section.items.map((item, itemIndex) => {
                    const sourceItem = getSourceItem(section, item, itemIndex);
                    const usedContentItemIds = new Set(
                      section.items
                        .filter((_, candidateIndex) => candidateIndex !== itemIndex)
                        .map((candidate) => candidate.contentItemId.trim())
                        .filter((contentItemId): contentItemId is string => Boolean(contentItemId))
                    );
                    const suggestedMatch =
                      !item.contentItemId && sourceItem
                        ? findBestContentMatch(
                            sourceItem.title,
                            initialData.contentOptions,
                            new Set()
                          )
                        : null;
                    const linkedContentItem = item.contentItemId
                      ? contentOptionById.get(item.contentItemId)
                      : null;

                    return (
                      <div
                        key={`${item.id ?? "new"}-${itemIndex}`}
                        className="rounded border border-stone-200 bg-stone-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium text-stone-900">
                              {item.customTitle || item.sourceTitle || `Item ${itemIndex + 1}`}
                            </div>
                            {item.sourceTitle ? (
                              <div className="mt-1 text-xs text-stone-500">
                                Bronitem: {item.sourceTitle}
                              </div>
                            ) : null}
                            {suggestedMatch ? (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateItem(sectionIndex, itemIndex, {
                                      contentItemId: suggestedMatch.id,
                                    })
                                  }
                                  className="rounded border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800"
                                >
                                  Koppel suggestie: {suggestedMatch.title}
                                </button>
                              </div>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => moveItem(sectionIndex, itemIndex, -1)}
                              disabled={itemIndex === 0}
                              className="rounded border border-stone-300 px-3 py-1.5 text-sm disabled:opacity-50"
                            >
                              Omhoog
                            </button>
                            <button
                              type="button"
                              onClick={() => moveItem(sectionIndex, itemIndex, 1)}
                              disabled={itemIndex === section.items.length - 1}
                              className="rounded border border-stone-300 px-3 py-1.5 text-sm disabled:opacity-50"
                            >
                              Omlaag
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(sectionIndex, itemIndex)}
                              className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700"
                            >
                              Verwijderen
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <FieldLabel>Gekoppeld content-item</FieldLabel>
                            <select
                              value={item.contentItemId}
                              onChange={(event) =>
                                updateItem(sectionIndex, itemIndex, {
                                  contentItemId: event.target.value,
                                })
                              }
                              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                            >
                              <option value="">Nog niet gekoppeld</option>
                              {initialData.contentOptions.map((contentItem) => (
                                <option
                                  key={contentItem.id}
                                  value={contentItem.id}
                                  disabled={usedContentItemIds.has(contentItem.id)}
                                >
                                  {contentItem.title}
                                  {contentItem.language
                                    ? ` (${contentItem.language.toUpperCase()})`
                                    : ""}
                                  {contentItem.slug ? ` - ${contentItem.slug}` : ""}
                                </option>
                              ))}
                            </select>
                            {item.contentItemId ? (
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                                <span>
                                  Gekoppeld aan:{" "}
                                  <span className="font-medium text-stone-700">
                                    {linkedContentItem?.title || "Onbekend item"}
                                  </span>
                                </span>
                                <a
                                  href={resolveAdminBrowserHref(
                                    pathname,
                                    `/admin/content/${item.contentItemId}`
                                  )}
                                  className="font-medium text-[#2271b1] hover:underline"
                                >
                                  Open content-item
                                </a>
                              </div>
                            ) : null}
                          </div>
                          <div>
                            <FieldLabel>Aangepaste titel</FieldLabel>
                            <input
                              value={item.customTitle}
                              onChange={(event) =>
                                updateItem(sectionIndex, itemIndex, {
                                  customTitle: event.target.value,
                                })
                              }
                              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                            />
                          </div>
                          <div>
                            <FieldLabel>Positie</FieldLabel>
                            <div className="mt-1 rounded border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
                              Item {itemIndex + 1} van {section.items.length}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <FieldLabel>Aangepaste teasertekst</FieldLabel>
                            <div className="mt-1 overflow-hidden rounded border border-stone-300">
                              <ClassicTextEditor
                                contentItemId={`${themeEditorUploadScope}/sections/${sectionIndex + 1}/items/${itemIndex + 1}`}
                                value={item.customExcerpt}
                                onChange={(value) =>
                                  updateItem(sectionIndex, itemIndex, {
                                    customExcerpt: value,
                                  })
                                }
                                height={200}
                              />
                            </div>
                          </div>
                          <div>
                            <FieldLabel>Override-afbeelding URL</FieldLabel>
                            <input
                              value={item.overrideImageUrl}
                              onChange={(event) =>
                                updateItem(sectionIndex, itemIndex, {
                                  overrideImageUrl: event.target.value,
                                })
                              }
                              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                            />
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setMediaTarget({
                                    kind: "item",
                                    itemIndex,
                                    sectionIndex,
                                  })
                                }
                                className="rounded border border-stone-300 px-3 py-2 text-sm"
                              >
                                Kies uit mediatheek
                              </button>
                              {item.overrideImageUrl ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateItem(sectionIndex, itemIndex, {
                                      overrideImageAlt: "",
                                      overrideImageUrl: "",
                                    })
                                  }
                                  className="rounded border border-stone-300 px-3 py-2 text-sm"
                                >
                                  Verwijderen
                                </button>
                              ) : null}
                            </div>
                            {sourceItem?.suggestedImagePath ? (
                              <p className="mt-1 text-xs leading-5 text-stone-500">
                                Bronafbeelding uit zip:{" "}
                                <span className="font-medium text-stone-700">
                                  {sourceItem.suggestedImagePath}
                                </span>
                              </p>
                            ) : null}
                            <ImagePreview
                              alt={item.overrideImageAlt}
                              url={item.overrideImageUrl}
                            />
                          </div>
                          <div>
                            <FieldLabel>Override-afbeelding alt</FieldLabel>
                            <input
                              value={item.overrideImageAlt}
                              onChange={(event) =>
                                updateItem(sectionIndex, itemIndex, {
                                  overrideImageAlt: event.target.value,
                                })
                              }
                              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                            />
                          </div>
                          <div>
                            <FieldLabel>Beeldpositie</FieldLabel>
                            <select
                              value={item.overrideImagePosition}
                              onChange={(event) =>
                                updateItem(sectionIndex, itemIndex, {
                                  overrideImagePosition:
                                    event.target.value as ThemeSectionItemDraft["overrideImagePosition"],
                                })
                              }
                              className="mt-1 w-full rounded border border-stone-300 px-3 py-2"
                            >
                              <option value="inherit">Overnemen</option>
                              <option value="top">Boven</option>
                              <option value="left">Links</option>
                              <option value="right">Rechts</option>
                              <option value="hidden">Verbergen</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              id={`featured-${sectionIndex}-${itemIndex}`}
                              type="checkbox"
                              checked={item.featured}
                              onChange={(event) =>
                                updateItem(sectionIndex, itemIndex, {
                                  featured: event.target.checked,
                                })
                              }
                            />
                            <label
                              htmlFor={`featured-${sectionIndex}-${itemIndex}`}
                              className="text-sm text-stone-700"
                            >
                              Uitgelicht item
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
                    Nog geen items in deze sectie.
                  </div>
                )}
              </div>
            </section>
          );
        })}

        {!draft.sections.length ? (
          <div className="rounded-lg border border-dashed border-stone-300 bg-white p-5 text-sm text-stone-600">
            Voeg eerst een sectie toe. Als je vanuit een bronmap bent gestart en er
            geen secties zijn ingevuld, bevat die bron waarschijnlijk vooral subthema&apos;s.
          </div>
        ) : null}
      </section>
      </div>

      <ThemeMediaPickerDialog
        open={Boolean(mediaTarget)}
        title="Kies afbeelding uit mediatheek"
        onClose={() => setMediaTarget(null)}
        onPick={handlePickedMedia}
      />
    </>
  );
}
