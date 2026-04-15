"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getResilientPreferredPublishedContentMapByIds } from "@/lib/content/language-preference";
import { normalizeSupabaseStorageUrl } from "@/lib/images/supabaseStorageUrl";
import { translateCategoryTerm } from "@/lib/i18n/categoryTranslations";

export type ThemePageSummary = {
  id: string;
  slug: string;
  eyebrow: string | null;
  title: string;
  description: string | null;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  heroImagePosition: "top" | "right" | "background";
  sortOrder: number;
  primaryCategory: {
    id: string;
    name: string;
    slug: string;
  } | null;
  parentTheme: {
    id: string;
    title: string;
    slug: string;
  } | null;
  sectionCount: number;
  itemCount: number;
  childThemeCount: number;
};

export type ThemePageItem = {
  id: string;
  title: string;
  excerpt: string | null;
  href: string;
  language: string | null;
  creditCost: number | null;
  featured: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
  imagePosition: "inherit" | "top" | "left" | "right" | "hidden";
};

export type ThemePageSection = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  layoutStyle: "featured" | "grid" | "list";
  sectionImageUrl: string | null;
  sectionImageAlt: string | null;
  sectionImagePosition: "none" | "top" | "left" | "right";
  sortOrder: number;
  items: ThemePageItem[];
};

export type ThemePageDetail = ThemePageSummary & {
  sections: ThemePageSection[];
  childThemes: ThemePageSummary[];
};

type ThemePageRow = {
  id: string;
  parent_theme_page_id: string | null;
  slug: string;
  eyebrow: string | null;
  title: string;
  description: string | null;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  hero_image_position: "top" | "right" | "background";
  primary_category_term_id: string | null;
  sort_order: number;
};

type ThemeSectionRow = {
  id: string;
  theme_page_id: string;
  slug: string;
  title: string;
  description: string | null;
  layout_style: "featured" | "grid" | "list";
  section_image_url: string | null;
  section_image_alt: string | null;
  section_image_position: "none" | "top" | "left" | "right";
  sort_order: number;
};

type ThemeSectionItemRow = {
  theme_section_id: string;
  content_item_id: string;
  custom_title: string | null;
  custom_excerpt: string | null;
  featured: boolean;
  override_image_url: string | null;
  override_image_alt: string | null;
  override_image_position: "inherit" | "top" | "left" | "right" | "hidden";
  sort_order: number;
};

type ThemeContentRow = {
  id: string;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  language: string | null;
  credit_cost: number | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  translation_source_id?: string | null;
};

type TermRow = {
  id: string;
  name: string;
  slug: string;
};

function buildContentHref(item: Pick<ThemeContentRow, "slug" | "language">) {
  if (!item.slug) {
    return "/content";
  }

  return item.language ? `/${item.language}/${item.slug}` : `/content/${item.slug}`;
}

function mapPrimaryCategory(
  termId: string | null,
  termById: Map<string, TermRow>
) {
  if (!termId) return null;
  const term = termById.get(termId);
  if (!term) return null;

  return {
    id: term.id,
    name: term.name,
    slug: term.slug,
  };
}

function mapParentTheme(
  parentId: string | null,
  pageById: Map<string, ThemePageRow>
) {
  if (!parentId) return null;
  const page = pageById.get(parentId);
  if (!page) return null;

  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
  };
}

function mapThemeSummary(
  page: ThemePageRow,
  termById: Map<string, TermRow>,
  pageById: Map<string, ThemePageRow>,
  sectionCount: number,
  itemCount: number,
  childThemeCount: number
): ThemePageSummary {
  return {
    id: page.id,
    slug: page.slug,
    eyebrow: page.eyebrow,
    title: page.title,
    description: page.description,
    heroImageUrl: normalizeSupabaseStorageUrl(page.hero_image_url),
    heroImageAlt: page.hero_image_alt,
    heroImagePosition: page.hero_image_position,
    sortOrder: page.sort_order,
    primaryCategory: mapPrimaryCategory(page.primary_category_term_id, termById),
    parentTheme: mapParentTheme(page.parent_theme_page_id, pageById),
    sectionCount,
    itemCount,
    childThemeCount,
  };
}

async function getThemeRows() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_theme_pages")
    .select(
      "id, parent_theme_page_id, slug, eyebrow, title, description, hero_image_url, hero_image_alt, hero_image_position, primary_category_term_id, sort_order"
    )
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    console.error("getThemeRows:", error);
    return [];
  }

  return (data ?? []) as ThemePageRow[];
}

async function getTermMap(
  categoryIds: string[],
  preferredLanguage?: string | null
) {
  if (!categoryIds.length) {
    return new Map<string, TermRow>();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_terms")
    .select("id, name, slug")
    .in("id", categoryIds);

  if (error) {
    console.error("getTermMap:", error);
    return new Map<string, TermRow>();
  }

  return new Map(
    ((data ?? []) as TermRow[]).map((term) => [
      term.id,
      translateCategoryTerm(term, preferredLanguage ?? "nl"),
    ])
  );
}

async function getSectionAndItemCounts(pageIds: string[]) {
  const supabase = createAdminClient();
  if (!pageIds.length) {
    return {
      sectionCountByPageId: new Map<string, number>(),
      itemCountByPageId: new Map<string, number>(),
    };
  }

  const { data: sections, error: sectionError } = await supabase
    .from("content_theme_sections")
    .select("id, theme_page_id")
    .in("theme_page_id", pageIds);

  if (sectionError) {
    console.error("getSectionAndItemCounts:sections", sectionError);
    return {
      sectionCountByPageId: new Map<string, number>(),
      itemCountByPageId: new Map<string, number>(),
    };
  }

  const sectionRows =
    (sections as Array<{ id: string; theme_page_id: string }> | null) ?? [];
  const sectionCountByPageId = new Map<string, number>();
  const pageIdBySectionId = new Map<string, string>();

  for (const section of sectionRows) {
    pageIdBySectionId.set(section.id, section.theme_page_id);
    sectionCountByPageId.set(
      section.theme_page_id,
      (sectionCountByPageId.get(section.theme_page_id) ?? 0) + 1
    );
  }

  if (!sectionRows.length) {
    return {
      sectionCountByPageId,
      itemCountByPageId: new Map<string, number>(),
    };
  }

  const { data: sectionItems, error: itemError } = await supabase
    .from("content_theme_section_items")
    .select("theme_section_id, content_item_id")
    .in(
      "theme_section_id",
      sectionRows.map((section) => section.id)
    );

  if (itemError) {
    console.error("getSectionAndItemCounts:items", itemError);
    return {
      sectionCountByPageId,
      itemCountByPageId: new Map<string, number>(),
    };
  }

  const contentIds = Array.from(
    new Set(
      (sectionItems ?? [])
        .map((row) => row.content_item_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  let publishedContentIds = new Set<string>();
  if (contentIds.length) {
    const { data: contentRows } = await supabase
      .from("content_items")
      .select("id")
      .in("id", contentIds)
      .eq("status", "published");

    publishedContentIds = new Set(
      (contentRows ?? [])
        .map((row) => row.id)
        .filter((value): value is string => Boolean(value))
    );
  }

  const itemCountByPageId = new Map<string, number>();
  for (const item of sectionItems ?? []) {
    if (!publishedContentIds.has(item.content_item_id)) continue;
    const pageId = pageIdBySectionId.get(item.theme_section_id);
    if (!pageId) continue;
    itemCountByPageId.set(pageId, (itemCountByPageId.get(pageId) ?? 0) + 1);
  }

  return {
    sectionCountByPageId,
    itemCountByPageId,
  };
}

export async function getPublishedThemePages(options?: {
  includeChildren?: boolean;
  preferredLanguage?: string | null;
}): Promise<ThemePageSummary[]> {
  const pages = await getThemeRows();
  if (!pages.length) return [];

  const pageById = new Map(pages.map((page) => [page.id, page]));
  const childThemeCountByPageId = new Map<string, number>();
  for (const page of pages) {
    if (!page.parent_theme_page_id) continue;
    childThemeCountByPageId.set(
      page.parent_theme_page_id,
      (childThemeCountByPageId.get(page.parent_theme_page_id) ?? 0) + 1
    );
  }

  const categoryIds = Array.from(
    new Set(
      pages
        .map((page) => page.primary_category_term_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  const [termById, counts] = await Promise.all([
    getTermMap(categoryIds, options?.preferredLanguage),
    getSectionAndItemCounts(pages.map((page) => page.id)),
  ]);

  return pages
    .filter((page) => options?.includeChildren || !page.parent_theme_page_id)
    .map((page) =>
      mapThemeSummary(
        page,
        termById,
        pageById,
        counts.sectionCountByPageId.get(page.id) ?? 0,
        counts.itemCountByPageId.get(page.id) ?? 0,
        childThemeCountByPageId.get(page.id) ?? 0
      )
    );
}

export async function getPublishedThemePageBySlug(
  slug: string,
  preferredLanguage?: string | null
): Promise<ThemePageDetail | null> {
  const supabase = createAdminClient();
  const pages = await getThemeRows();
  const page = pages.find((row) => row.slug === slug) ?? null;

  if (!page) return null;

  const pageById = new Map(pages.map((row) => [row.id, row]));
  const categoryIds = Array.from(
    new Set(
      pages
        .map((row) => row.primary_category_term_id)
        .filter((value): value is string => Boolean(value))
    )
  );
  const termById = await getTermMap(categoryIds, preferredLanguage);

  const childPages = pages.filter((row) => row.parent_theme_page_id === page.id);
  const childPageIds = childPages.map((row) => row.id);
  const childCounts = await getSectionAndItemCounts(childPageIds);

  const { data: sections, error: sectionsError } = await supabase
    .from("content_theme_sections")
    .select(
      "id, theme_page_id, slug, title, description, layout_style, section_image_url, section_image_alt, section_image_position, sort_order"
    )
    .eq("theme_page_id", page.id)
    .order("sort_order", { ascending: true });

  if (sectionsError) {
    console.error("getPublishedThemePageBySlug:sections", sectionsError);
    return {
      ...mapThemeSummary(
        page,
        termById,
        pageById,
        0,
        0,
        childPages.length
      ),
      sections: [],
      childThemes: childPages.map((child) =>
        mapThemeSummary(
          child,
          termById,
          pageById,
          childCounts.sectionCountByPageId.get(child.id) ?? 0,
          childCounts.itemCountByPageId.get(child.id) ?? 0,
          0
        )
      ),
    };
  }

  const sectionRows = (sections ?? []) as ThemeSectionRow[];
  const sectionIds = sectionRows.map((section) => section.id);

  let sectionItemRows: ThemeSectionItemRow[] = [];
  if (sectionIds.length) {
    const { data: sectionItems, error: sectionItemsError } = await supabase
      .from("content_theme_section_items")
      .select(
        "theme_section_id, content_item_id, custom_title, custom_excerpt, featured, override_image_url, override_image_alt, override_image_position, sort_order"
      )
      .in("theme_section_id", sectionIds)
      .order("sort_order", { ascending: true });

    if (sectionItemsError) {
      console.error("getPublishedThemePageBySlug:sectionItems", sectionItemsError);
    } else {
      sectionItemRows = (sectionItems ?? []) as ThemeSectionItemRow[];
    }
  }

  const contentIds = Array.from(
    new Set(
      sectionItemRows
        .map((row) => row.content_item_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  let contentById = new Map<string, ThemeContentRow>();
  if (contentIds.length) {
    contentById = await getResilientPreferredPublishedContentMapByIds<ThemeContentRow>({
      contentIds,
      preferredLanguage,
      select:
        "id, title, slug, excerpt, language, credit_cost, featured_image_url, featured_image_alt, translation_source_id",
    });
  }

  const itemsBySectionId = new Map<string, ThemePageItem[]>();
  const seenContentIdsBySectionId = new Map<string, Set<string>>();
  for (const row of sectionItemRows) {
    const content = contentById.get(row.content_item_id);
    if (!content) continue;

    const seenContentIds =
      seenContentIdsBySectionId.get(row.theme_section_id) ?? new Set<string>();
    if (seenContentIds.has(content.id)) {
      continue;
    }
    seenContentIds.add(content.id);
    seenContentIdsBySectionId.set(row.theme_section_id, seenContentIds);

    const items = itemsBySectionId.get(row.theme_section_id) ?? [];
    items.push({
      id: content.id,
      title: row.custom_title || content.title || "Ongetitelde content",
      excerpt: row.custom_excerpt ?? content.excerpt,
      href: buildContentHref(content),
      language: content.language,
      creditCost: content.credit_cost,
      featured: row.featured,
      imageUrl: normalizeSupabaseStorageUrl(
        row.override_image_url || content.featured_image_url
      ),
      imageAlt:
        row.override_image_alt ||
        content.featured_image_alt ||
        row.custom_title ||
        content.title ||
        "Thema-afbeelding",
      imagePosition: row.override_image_position,
    });
    itemsBySectionId.set(row.theme_section_id, items);
  }

  const mappedSections = sectionRows.map((section) => ({
    id: section.id,
    slug: section.slug,
    title: section.title,
    description: section.description,
    layoutStyle: section.layout_style,
    sectionImageUrl: normalizeSupabaseStorageUrl(section.section_image_url),
    sectionImageAlt: section.section_image_alt,
    sectionImagePosition: section.section_image_position,
    sortOrder: section.sort_order,
    items: itemsBySectionId.get(section.id) ?? [],
  }));

  const itemCount = mappedSections.reduce(
    (count, section) => count + section.items.length,
    0
  );

  return {
    ...mapThemeSummary(
      page,
      termById,
      pageById,
      mappedSections.length,
      itemCount,
      childPages.length
    ),
    sections: mappedSections,
    childThemes: childPages.map((child) =>
      mapThemeSummary(
        child,
        termById,
        pageById,
        childCounts.sectionCountByPageId.get(child.id) ?? 0,
        childCounts.itemCountByPageId.get(child.id) ?? 0,
        0
      )
    ),
  };
}
