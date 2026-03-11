"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type ThemePageSummary = {
  id: string;
  slug: string;
  eyebrow: string | null;
  title: string;
  description: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  sortOrder: number;
  primaryCategory: {
    id: string;
    name: string;
    slug: string;
  } | null;
  sectionCount: number;
  itemCount: number;
};

export type ThemePageItem = {
  id: string;
  title: string;
  excerpt: string | null;
  href: string;
  language: string | null;
  creditCost: number | null;
  featured: boolean;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
};

export type ThemePageSection = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  layoutStyle: "featured" | "grid" | "list";
  sortOrder: number;
  items: ThemePageItem[];
};

export type ThemePageDetail = ThemePageSummary & {
  sections: ThemePageSection[];
};

type ThemePageRow = {
  id: string;
  slug: string;
  eyebrow: string | null;
  title: string;
  description: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
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
  sort_order: number;
};

type ThemeSectionItemRow = {
  theme_section_id: string;
  content_item_id: string;
  custom_title: string | null;
  custom_excerpt: string | null;
  featured: boolean;
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

function mapThemeSummary(
  page: ThemePageRow,
  termById: Map<string, TermRow>,
  sectionCount: number,
  itemCount: number
): ThemePageSummary {
  return {
    id: page.id,
    slug: page.slug,
    eyebrow: page.eyebrow,
    title: page.title,
    description: page.description,
    featuredImageUrl: page.featured_image_url,
    featuredImageAlt: page.featured_image_alt,
    sortOrder: page.sort_order,
    primaryCategory: mapPrimaryCategory(page.primary_category_term_id, termById),
    sectionCount,
    itemCount,
  };
}

export async function getPublishedThemePages(): Promise<ThemePageSummary[]> {
  const supabase = createAdminClient();
  const { data: pages, error } = await supabase
    .from("content_theme_pages")
    .select(
      "id, slug, eyebrow, title, description, featured_image_url, featured_image_alt, primary_category_term_id, sort_order"
    )
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    console.error("getPublishedThemePages:", error);
    return [];
  }

  const pageRows = (pages ?? []) as ThemePageRow[];
  if (!pageRows.length) return [];

  const categoryIds = Array.from(
    new Set(
      pageRows
        .map((page) => page.primary_category_term_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  const sectionQuery = await supabase
    .from("content_theme_sections")
    .select("id, theme_page_id")
    .in(
      "theme_page_id",
      pageRows.map((page) => page.id)
    );

  if (sectionQuery.error) {
    console.error("getPublishedThemePages:sections", sectionQuery.error);
    return pageRows.map((page) => ({
      ...mapThemeSummary(page, new Map<string, TermRow>(), 0, 0),
    }));
  }

  const themePageIdBySectionId = new Map<string, string>();
  for (const section of sectionQuery.data ?? []) {
    if (section.id && section.theme_page_id) {
      themePageIdBySectionId.set(section.id, section.theme_page_id);
    }
  }

  const sectionIds = Array.from(themePageIdBySectionId.keys());
  let publishedContentIds = new Set<string>();
  let sectionItemRows: ThemeSectionItemRow[] = [];

  if (sectionIds.length) {
    const sectionItemsQuery = await supabase
      .from("content_theme_section_items")
      .select("theme_section_id, content_item_id, custom_title, custom_excerpt, featured, sort_order")
      .in("theme_section_id", sectionIds);

    if (!sectionItemsQuery.error) {
      sectionItemRows = (sectionItemsQuery.data ?? []) as ThemeSectionItemRow[];

      const contentIds = Array.from(
        new Set(
          sectionItemRows
            .map((row) => row.content_item_id)
            .filter((value): value is string => Boolean(value))
        )
      );

      if (contentIds.length) {
        const publishedQuery = await supabase
          .from("content_items")
          .select("id")
          .in("id", contentIds)
          .eq("status", "published");

        if (!publishedQuery.error) {
          publishedContentIds = new Set(
            (publishedQuery.data ?? [])
              .map((row) => row.id)
              .filter((value): value is string => Boolean(value))
          );
        }
      }
    }
  }

  let termById = new Map<string, TermRow>();
  if (categoryIds.length) {
    const termQuery = await supabase
      .from("content_terms")
      .select("id, name, slug")
      .in("id", categoryIds);

    if (!termQuery.error) {
      termById = new Map(
        ((termQuery.data ?? []) as TermRow[]).map((term) => [term.id, term])
      );
    }
  }

  const sectionCountByPageId = new Map<string, number>();
  for (const pageId of themePageIdBySectionId.values()) {
    sectionCountByPageId.set(pageId, (sectionCountByPageId.get(pageId) ?? 0) + 1);
  }

  const itemCountByPageId = new Map<string, number>();
  for (const row of sectionItemRows) {
    if (!publishedContentIds.has(row.content_item_id)) continue;
    const pageId = themePageIdBySectionId.get(row.theme_section_id);
    if (!pageId) continue;
    itemCountByPageId.set(pageId, (itemCountByPageId.get(pageId) ?? 0) + 1);
  }

  return pageRows.map((page) =>
    mapThemeSummary(
      page,
      termById,
      sectionCountByPageId.get(page.id) ?? 0,
      itemCountByPageId.get(page.id) ?? 0
    )
  );
}

export async function getPublishedThemePageBySlug(
  slug: string
): Promise<ThemePageDetail | null> {
  const supabase = createAdminClient();
  const { data: page, error } = await supabase
    .from("content_theme_pages")
    .select(
      "id, slug, eyebrow, title, description, featured_image_url, featured_image_alt, primary_category_term_id, sort_order"
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle<ThemePageRow>();

  if (error) {
    console.error("getPublishedThemePageBySlug:", error);
    return null;
  }

  if (!page) return null;

  const [{ data: sections, error: sectionsError }, { data: terms }] = await Promise.all([
    supabase
      .from("content_theme_sections")
      .select("id, theme_page_id, slug, title, description, layout_style, sort_order")
      .eq("theme_page_id", page.id)
      .order("sort_order", { ascending: true }),
    page.primary_category_term_id
      ? supabase
          .from("content_terms")
          .select("id, name, slug")
          .eq("id", page.primary_category_term_id)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (sectionsError) {
    console.error("getPublishedThemePageBySlug:sections", sectionsError);
    return {
      ...mapThemeSummary(
        page,
        new Map<string, TermRow>(
          ((terms ?? []) as TermRow[]).map((term) => [term.id, term])
        ),
        0,
        0
      ),
      sections: [],
    };
  }

  const sectionRows = (sections ?? []) as ThemeSectionRow[];
  const termById = new Map<string, TermRow>(
    ((terms ?? []) as TermRow[]).map((term) => [term.id, term])
  );

  if (!sectionRows.length) {
    return {
      ...mapThemeSummary(page, termById, 0, 0),
      sections: [],
    };
  }

  const { data: sectionItems, error: sectionItemsError } = await supabase
    .from("content_theme_section_items")
    .select("theme_section_id, content_item_id, custom_title, custom_excerpt, featured, sort_order")
    .in(
      "theme_section_id",
      sectionRows.map((section) => section.id)
    )
    .order("sort_order", { ascending: true });

  if (sectionItemsError) {
    console.error("getPublishedThemePageBySlug:sectionItems", sectionItemsError);
    return {
      ...mapThemeSummary(page, termById, sectionRows.length, 0),
      sections: sectionRows.map((section) => ({
        id: section.id,
        slug: section.slug,
        title: section.title,
        description: section.description,
        layoutStyle: section.layout_style,
        sortOrder: section.sort_order,
        items: [],
      })),
    };
  }

  const sectionItemRows = (sectionItems ?? []) as ThemeSectionItemRow[];
  const contentIds = Array.from(
    new Set(
      sectionItemRows
        .map((row) => row.content_item_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  let contentById = new Map<string, ThemeContentRow>();
  if (contentIds.length) {
    const { data: contentRows, error: contentError } = await supabase
      .from("content_items")
      .select(
        "id, title, slug, excerpt, language, credit_cost, featured_image_url, featured_image_alt"
      )
      .in("id", contentIds)
      .eq("status", "published");

    if (contentError) {
      console.error("getPublishedThemePageBySlug:content", contentError);
    } else {
      contentById = new Map(
        ((contentRows ?? []) as ThemeContentRow[]).map((item) => [item.id, item])
      );
    }
  }

  const sectionItemsBySectionId = new Map<string, ThemePageItem[]>();

  for (const row of sectionItemRows) {
    const item = contentById.get(row.content_item_id);
    if (!item) continue;

    const sectionItems = sectionItemsBySectionId.get(row.theme_section_id) ?? [];
    sectionItems.push({
      id: item.id,
      title: row.custom_title || item.title || "Ongetitelde content",
      excerpt: row.custom_excerpt ?? item.excerpt,
      href: buildContentHref(item),
      language: item.language,
      creditCost: item.credit_cost,
      featured: row.featured,
      featuredImageUrl: item.featured_image_url,
      featuredImageAlt: item.featured_image_alt,
    });
    sectionItemsBySectionId.set(row.theme_section_id, sectionItems);
  }

  const mappedSections = sectionRows.map((section) => ({
    id: section.id,
    slug: section.slug,
    title: section.title,
    description: section.description,
    layoutStyle: section.layout_style,
    sortOrder: section.sort_order,
    items: sectionItemsBySectionId.get(section.id) ?? [],
  }));

  const itemCount = mappedSections.reduce((count, section) => count + section.items.length, 0);

  return {
    ...mapThemeSummary(page, termById, mappedSections.length, itemCount),
    sections: mappedSections,
  };
}
