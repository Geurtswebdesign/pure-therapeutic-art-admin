"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getThemeImportedMediaLookup,
  type ThemeImportedMediaEntry,
} from "@/lib/content/theme-media-manifest";
import {
  getThemeSourceEntry,
  getThemeSourceManifest,
  type ThemeSourceEntry,
} from "@/lib/content/theme-source-manifest";

export type ThemeOption = {
  id: string;
  title: string;
  slug: string;
};

export type ThemeCategoryOption = {
  id: string;
  name: string;
  slug: string;
  label: string;
  parentId: string | null;
  isHomepageSeed: boolean;
};

export type ThemeContentOption = {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  language: string | null;
};

export type ThemeSectionItemDraft = {
  id: string | null;
  contentItemId: string;
  sourceTitle: string;
  customTitle: string;
  customExcerpt: string;
  featured: boolean;
  overrideImageUrl: string;
  overrideImageAlt: string;
  overrideImagePosition: "inherit" | "top" | "left" | "right" | "hidden";
  sortOrder: number;
};

export type ThemeSectionDraft = {
  id: string | null;
  slug: string;
  title: string;
  description: string;
  layoutStyle: "featured" | "grid" | "list";
  sectionImageUrl: string;
  sectionImageAlt: string;
  sectionImagePosition: "none" | "top" | "left" | "right";
  sortOrder: number;
  items: ThemeSectionItemDraft[];
};

export type ThemePageDraft = {
  id: string | null;
  parentThemePageId: string;
  sourceKey: string;
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  heroImageUrl: string;
  heroImageAlt: string;
  heroImagePosition: "top" | "right" | "background";
  primaryCategoryTermId: string;
  isPublished: boolean;
  sortOrder: number;
  sections: ThemeSectionDraft[];
};

export type AdminThemeSummary = {
  id: string;
  slug: string;
  title: string;
  sourceKey: string | null;
  isPublished: boolean;
  sortOrder: number;
  parentTheme: ThemeOption | null;
  sectionCount: number;
  itemCount: number;
};

export type ThemeEditorData = {
  draft: ThemePageDraft;
  contentOptions: ThemeContentOption[];
  parentThemeOptions: ThemeOption[];
  categoryOptions: ThemeCategoryOption[];
  sourceEntry: ThemeSourceEntry | null;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeMatchValue(text: string | null | undefined) {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "")
    .replace(/-+/g, "");
}

function findMatchingSectionIndex(
  sections: ThemeSectionDraft[],
  target: ThemeSectionDraft
) {
  return sections.findIndex((section) => {
    if (section.slug && target.slug) {
      return section.slug === target.slug;
    }

    return normalizeMatchValue(section.title) === normalizeMatchValue(target.title);
  });
}

function findMatchingItemIndex(
  items: ThemeSectionItemDraft[],
  target: ThemeSectionItemDraft,
  fallbackIndex: number
) {
  const targetSource = normalizeMatchValue(target.sourceTitle);
  if (targetSource) {
    const index = items.findIndex(
      (item) => normalizeMatchValue(item.sourceTitle) === targetSource
    );
    if (index >= 0) return index;
  }

  return fallbackIndex < items.length ? fallbackIndex : -1;
}

function mergeDraftWithSourceDraft(
  draft: ThemePageDraft,
  sourceDraft: ThemePageDraft
): ThemePageDraft {
  const mergedSections = [...draft.sections];

  for (const sourceSection of sourceDraft.sections) {
    const existingIndex = findMatchingSectionIndex(mergedSections, sourceSection);

    if (existingIndex === -1) {
      mergedSections.push(sourceSection);
      continue;
    }

    const existingSection = mergedSections[existingIndex];
    const mergedItems = existingSection.items.length
      ? existingSection.items.map((item, itemIndex) => {
          const sourceItemIndex = findMatchingItemIndex(
            sourceSection.items,
            item,
            itemIndex
          );
          const sourceItem =
            sourceItemIndex >= 0 ? sourceSection.items[sourceItemIndex] : null;

          if (!sourceItem) {
            return item;
          }

          return {
            ...item,
            sourceTitle: item.sourceTitle || sourceItem.sourceTitle,
            overrideImageAlt:
              item.overrideImageAlt || sourceItem.overrideImageAlt,
            overrideImagePosition:
              item.overrideImagePosition === "inherit" &&
              sourceItem.overrideImagePosition !== "inherit"
                ? sourceItem.overrideImagePosition
                : item.overrideImagePosition,
            overrideImageUrl:
              item.overrideImageUrl || sourceItem.overrideImageUrl,
          };
        })
      : sourceSection.items;

    mergedSections[existingIndex] = {
      ...existingSection,
      description: existingSection.description || sourceSection.description,
      sectionImageUrl:
        existingSection.sectionImageUrl || sourceSection.sectionImageUrl,
      sectionImageAlt:
        existingSection.sectionImageAlt || sourceSection.sectionImageAlt,
      sectionImagePosition:
        existingSection.sectionImagePosition === "none" &&
        sourceSection.sectionImagePosition !== "none"
          ? sourceSection.sectionImagePosition
          : existingSection.sectionImagePosition,
      items: mergedItems,
    };
  }

  return {
    ...draft,
    eyebrow: draft.eyebrow || sourceDraft.eyebrow,
    description: draft.description || sourceDraft.description,
    heroImageUrl: draft.heroImageUrl || sourceDraft.heroImageUrl,
    heroImageAlt: draft.heroImageAlt || sourceDraft.heroImageAlt,
    sections: mergedSections.sort((left, right) => left.sortOrder - right.sortOrder),
  };
}

function emptyDraft(): ThemePageDraft {
  return {
    id: null,
    parentThemePageId: "",
    sourceKey: "",
    slug: "",
    eyebrow: "",
    title: "",
    description: "",
    heroImageUrl: "",
    heroImageAlt: "",
    heroImagePosition: "right",
    primaryCategoryTermId: "",
    isPublished: false,
    sortOrder: 0,
    sections: [],
  };
}

export async function getAdminThemeSummaries(): Promise<AdminThemeSummary[]> {
  const supabase = createAdminClient();
  const { data: pages, error } = await supabase
    .from("content_theme_pages")
    .select(
      "id, slug, title, source_key, is_published, sort_order, parent_theme_page_id"
    )
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    throw new Error(`Themes laden mislukt: ${error.message}`);
  }

  const pageRows =
    pages as Array<{
      id: string;
      slug: string;
      title: string;
      source_key: string | null;
      is_published: boolean;
      sort_order: number;
      parent_theme_page_id: string | null;
    }> | null;

  if (!pageRows?.length) return [];

  const ids = pageRows.map((page) => page.id);

  const [{ data: sections }, { data: sectionItems }] = await Promise.all([
    supabase
      .from("content_theme_sections")
      .select("id, theme_page_id")
      .in("theme_page_id", ids),
    supabase
      .from("content_theme_section_items")
      .select("theme_section_id")
      .in(
        "theme_section_id",
        (
          await supabase
            .from("content_theme_sections")
            .select("id")
            .in("theme_page_id", ids)
        ).data?.map((row) => row.id) ?? []
      ),
  ]);

  const pageById = new Map(
    pageRows.map((page) => [
      page.id,
      {
        id: page.id,
        title: page.title,
        slug: page.slug,
      },
    ])
  );

  const sectionCountByPageId = new Map<string, number>();
  const pageIdBySectionId = new Map<string, string>();

  for (const section of sections ?? []) {
    if (!section.id || !section.theme_page_id) continue;
    pageIdBySectionId.set(section.id, section.theme_page_id);
    sectionCountByPageId.set(
      section.theme_page_id,
      (sectionCountByPageId.get(section.theme_page_id) ?? 0) + 1
    );
  }

  const itemCountByPageId = new Map<string, number>();
  for (const item of sectionItems ?? []) {
    const pageId = pageIdBySectionId.get(item.theme_section_id);
    if (!pageId) continue;
    itemCountByPageId.set(pageId, (itemCountByPageId.get(pageId) ?? 0) + 1);
  }

  return pageRows.map((page) => ({
    id: page.id,
    slug: page.slug,
    title: page.title,
    sourceKey: page.source_key,
    isPublished: page.is_published,
    sortOrder: page.sort_order,
    parentTheme: page.parent_theme_page_id
      ? pageById.get(page.parent_theme_page_id) ?? null
      : null,
    sectionCount: sectionCountByPageId.get(page.id) ?? 0,
    itemCount: itemCountByPageId.get(page.id) ?? 0,
  }));
}

async function getCategoryOptions() {
  const supabase = createAdminClient();
  const { data: taxonomy } = await supabase
    .from("content_taxonomies")
    .select("id")
    .eq("slug", "category")
    .maybeSingle<{ id: string }>();

  if (!taxonomy?.id) return [];

  const { data: terms } = await supabase
    .from("content_terms")
    .select("id, name, slug, parent_id, is_homepage_seed")
    .eq("taxonomy_id", taxonomy.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const termRows =
    (terms as Array<{
      id: string;
      name: string;
      slug: string;
      parent_id: string | null;
      is_homepage_seed: boolean | null;
    }> | null) ?? [];
  const termById = new Map(termRows.map((term) => [term.id, term]));

  return termRows.map((term) => ({
    id: term.id,
    name: term.name,
    slug: term.slug,
    label: term.parent_id
      ? `${termById.get(term.parent_id)?.name ?? "Categorie"} > ${term.name}`
      : term.name,
    parentId: term.parent_id,
    isHomepageSeed: Boolean(term.is_homepage_seed),
  }));
}

async function getContentOptions() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("content_items")
    .select("id, title, slug, status, language")
    .neq("status", "trash")
    .order("title", { ascending: true });

  return (
    (data ?? []).map((item) => ({
      id: item.id,
      title: item.title || "Ongetitelde content",
      slug: item.slug,
      status: item.status,
      language: item.language,
    })) as ThemeContentOption[]
  );
}

async function getParentThemeOptions(excludeId?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from("content_theme_pages")
    .select("id, title, slug")
    .order("title", { ascending: true });

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data } = await query;
  return (data ?? []) as ThemeOption[];
}

function buildMatchedSourceDraft(
  sourceEntry: ThemeSourceEntry,
  contentOptions: ThemeContentOption[],
  importedMediaBySourcePath: Map<string, ThemeImportedMediaEntry>
): ThemePageDraft {
  const exactBySlug = new Map(
    contentOptions
      .filter((item) => item.slug)
      .map((item) => [normalizeMatchValue(item.slug), item.id])
  );
  const exactByTitle = new Map(
    contentOptions.map((item) => [normalizeMatchValue(item.title), item.id])
  );

  const sections: ThemeSectionDraft[] = sourceEntry.sections.map((section, sectionIndex) => ({
    id: null,
    slug: section.slug || slugify(section.title),
    title: section.title,
    description: section.description,
    layoutStyle: section.suggestedLayout,
    sectionImageUrl:
      importedMediaBySourcePath.get(section.suggestedSectionImagePath || "")
        ?.publicUrl ?? "",
    sectionImageAlt: section.title,
    sectionImagePosition: section.suggestedSectionImagePath ? "top" : "none",
    sortOrder: (sectionIndex + 1) * 10,
    items: section.items.map((item, itemIndex) => {
      const normalizedTitle = normalizeMatchValue(item.title);
      const contentItemId =
        exactBySlug.get(normalizedTitle) ??
        exactByTitle.get(normalizedTitle) ??
        "";

      return {
        id: null,
        contentItemId,
        sourceTitle: item.title,
        customTitle: "",
        customExcerpt: "",
        featured: itemIndex === 0 && section.suggestedLayout === "featured",
        overrideImageUrl:
          importedMediaBySourcePath.get(item.suggestedImagePath || "")?.publicUrl ?? "",
        overrideImageAlt: item.title,
        overrideImagePosition: item.suggestedImagePath ? "top" : "inherit",
        sortOrder: item.order * 10,
      };
    }),
  }));

  return {
    id: null,
    parentThemePageId: "",
    sourceKey: sourceEntry.key,
    slug: sourceEntry.suggestedSlug,
    eyebrow: sourceEntry.parentKey ? "Subthema" : "Thema",
    title: sourceEntry.title,
    description: sourceEntry.description,
    heroImageUrl:
      importedMediaBySourcePath.get(sourceEntry.suggestedHeroImagePath || "")
        ?.publicUrl ?? "",
    heroImageAlt: sourceEntry.title,
    heroImagePosition: sourceEntry.suggestedHeroImagePath ? "right" : "top",
    primaryCategoryTermId: "",
    isPublished: false,
    sortOrder: 0,
    sections,
  };
}

async function getThemeIdBySourceKey(sourceKey: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("content_theme_pages")
    .select("id")
    .eq("source_key", sourceKey)
    .maybeSingle<{ id: string }>();

  return data?.id ?? "";
}

export async function getThemeEditorData(input?: {
  themeId?: string;
  sourceKey?: string;
}): Promise<ThemeEditorData> {
  const [contentOptions, categoryOptions, sourceManifest, importedMediaBySourcePath] =
    await Promise.all([
    getContentOptions(),
    getCategoryOptions(),
    getThemeSourceManifest(),
    getThemeImportedMediaLookup(),
  ]);

  if (!input?.themeId) {
    const sourceEntry = input?.sourceKey
      ? await getThemeSourceEntry(input.sourceKey)
      : null;
    const draft = sourceEntry
      ? buildMatchedSourceDraft(
          sourceEntry,
          contentOptions,
          importedMediaBySourcePath
        )
      : emptyDraft();

    if (sourceEntry?.parentKey) {
      const parentFromManifest = sourceManifest.themes.find(
        (theme) => theme.key === sourceEntry.parentKey
      );
      if (parentFromManifest) {
        draft.eyebrow = "Subthema";
      }

      draft.parentThemePageId = await getThemeIdBySourceKey(sourceEntry.parentKey);
    }

    return {
      draft,
      contentOptions,
      parentThemeOptions: await getParentThemeOptions(),
      categoryOptions,
      sourceEntry,
    };
  }

  const supabase = createAdminClient();
  const { data: themePage, error } = await supabase
    .from("content_theme_pages")
    .select(
      "id, parent_theme_page_id, source_key, slug, eyebrow, title, description, hero_image_url, hero_image_alt, hero_image_position, primary_category_term_id, is_published, sort_order"
    )
    .eq("id", input.themeId)
    .maybeSingle();

  if (error || !themePage) {
    throw new Error(error?.message || "Thema niet gevonden");
  }

  const sourceEntry = themePage.source_key
    ? await getThemeSourceEntry(themePage.source_key)
    : null;

  const { data: sections } = await supabase
    .from("content_theme_sections")
    .select(
      "id, slug, title, description, layout_style, section_image_url, section_image_alt, section_image_position, sort_order"
    )
    .eq("theme_page_id", themePage.id)
    .order("sort_order", { ascending: true });

  const sectionRows =
    (sections as Array<{
      id: string;
      slug: string;
      title: string;
      description: string | null;
      layout_style: "featured" | "grid" | "list";
      section_image_url: string | null;
      section_image_alt: string | null;
      section_image_position: "none" | "top" | "left" | "right";
      sort_order: number;
    }> | null) ?? [];

  const { data: sectionItems } = await supabase
    .from("content_theme_section_items")
    .select(
      "id, theme_section_id, content_item_id, custom_title, custom_excerpt, featured, override_image_url, override_image_alt, override_image_position, sort_order"
    )
    .in(
      "theme_section_id",
      sectionRows.map((section) => section.id)
    )
    .order("sort_order", { ascending: true });

  const itemsBySectionId = new Map<string, ThemeSectionItemDraft[]>();
  for (const item of (sectionItems ?? []) as Array<{
    id: string;
    theme_section_id: string;
    content_item_id: string;
    custom_title: string | null;
    custom_excerpt: string | null;
    featured: boolean;
    override_image_url: string | null;
    override_image_alt: string | null;
    override_image_position: "inherit" | "top" | "left" | "right" | "hidden";
    sort_order: number;
  }>) {
    const list = itemsBySectionId.get(item.theme_section_id) ?? [];
    list.push({
      id: item.id,
      contentItemId: item.content_item_id,
      sourceTitle: "",
      customTitle: item.custom_title ?? "",
      customExcerpt: item.custom_excerpt ?? "",
      featured: item.featured,
      overrideImageUrl: item.override_image_url ?? "",
      overrideImageAlt: item.override_image_alt ?? "",
      overrideImagePosition: item.override_image_position,
      sortOrder: item.sort_order,
    });
    itemsBySectionId.set(item.theme_section_id, list);
  }

  let draft: ThemePageDraft = {
    id: themePage.id,
    parentThemePageId: themePage.parent_theme_page_id ?? "",
    sourceKey: themePage.source_key ?? "",
    slug: themePage.slug,
    eyebrow: themePage.eyebrow ?? "",
    title: themePage.title,
    description: themePage.description ?? "",
    heroImageUrl: themePage.hero_image_url ?? "",
    heroImageAlt: themePage.hero_image_alt ?? "",
    heroImagePosition: themePage.hero_image_position ?? "right",
    primaryCategoryTermId: themePage.primary_category_term_id ?? "",
    isPublished: themePage.is_published,
    sortOrder: themePage.sort_order ?? 0,
    sections: sectionRows.map((section) => ({
      id: section.id,
      slug: section.slug,
      title: section.title,
      description: section.description ?? "",
      layoutStyle: section.layout_style,
      sectionImageUrl: section.section_image_url ?? "",
      sectionImageAlt: section.section_image_alt ?? "",
      sectionImagePosition: section.section_image_position ?? "none",
      sortOrder: section.sort_order,
      items: itemsBySectionId.get(section.id) ?? [],
    })),
  };

  if (sourceEntry) {
    draft = mergeDraftWithSourceDraft(
      draft,
      buildMatchedSourceDraft(
        sourceEntry,
        contentOptions,
        importedMediaBySourcePath
      )
    );

    if (!draft.parentThemePageId && sourceEntry.parentKey) {
      draft.parentThemePageId = await getThemeIdBySourceKey(sourceEntry.parentKey);
    }
  }

  return {
    draft,
    contentOptions,
    parentThemeOptions: await getParentThemeOptions(themePage.id),
    categoryOptions,
    sourceEntry,
  };
}
