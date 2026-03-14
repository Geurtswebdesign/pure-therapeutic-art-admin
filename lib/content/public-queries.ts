"use server";

import { createAdminClient } from "@/lib/supabase/admin";

type ThemePageCategoryRow = {
  id: string;
  parent_theme_page_id: string | null;
  primary_category_term_id: string | null;
};

type ThemeSectionRow = {
  id: string;
  theme_page_id: string;
};

type ThemeSectionItemRow = {
  theme_section_id: string;
  content_item_id: string;
  custom_title?: string | null;
  sort_order?: number;
};

type ThemeItemNavigationLink = {
  href: string;
  title: string;
};

export type ThemeItemNavigation = {
  theme: {
    slug: string;
    title: string;
  };
  previous: ThemeItemNavigationLink | null;
  next: ThemeItemNavigationLink | null;
};

function createEmptyItemSetMap(termIds: string[]) {
  return new Map(termIds.map((termId) => [termId, new Set<string>()]));
}

function buildContentHref(item: {
  slug: string | null;
  language: string | null;
}) {
  if (!item.slug) {
    return "/content";
  }

  return item.language ? `/${item.language}/${item.slug}` : `/content/${item.slug}`;
}

async function getThemeLinkedContentIdsByCategoryTermIds(termIds: string[]) {
  if (!termIds.length) {
    return new Map<string, Set<string>>();
  }

  const supabase = createAdminClient();
  const uniqueTermIds = Array.from(new Set(termIds.filter(Boolean)));
  const termIdSet = new Set(uniqueTermIds);
  const itemIdsByTermId = createEmptyItemSetMap(uniqueTermIds);

  const { data: pages, error: pagesError } = await supabase
    .from("content_theme_pages")
    .select("id, parent_theme_page_id, primary_category_term_id")
    .eq("is_published", true);

  if (pagesError) {
    console.error("getThemeLinkedContentIdsByCategoryTermIds:pages", pagesError);
    return itemIdsByTermId;
  }

  const pageRows = (pages ?? []) as ThemePageCategoryRow[];
  if (!pageRows.length) {
    return itemIdsByTermId;
  }

  const childPageIdsByParentId = new Map<string, string[]>();
  for (const page of pageRows) {
    if (!page.parent_theme_page_id) continue;
    const siblings = childPageIdsByParentId.get(page.parent_theme_page_id) ?? [];
    siblings.push(page.id);
    childPageIdsByParentId.set(page.parent_theme_page_id, siblings);
  }

  const pageIdsByTermId = new Map(uniqueTermIds.map((termId) => [termId, new Set<string>()]));

  for (const page of pageRows) {
    if (!page.primary_category_term_id || !termIdSet.has(page.primary_category_term_id)) {
      continue;
    }

    const pageIds = pageIdsByTermId.get(page.primary_category_term_id);
    if (!pageIds) continue;

    const queue = [page.id];
    while (queue.length) {
      const currentPageId = queue.shift();
      if (!currentPageId || pageIds.has(currentPageId)) continue;

      pageIds.add(currentPageId);
      const childPageIds = childPageIdsByParentId.get(currentPageId) ?? [];
      queue.push(...childPageIds);
    }
  }

  const allPageIds = Array.from(
    new Set(
      Array.from(pageIdsByTermId.values()).flatMap((pageIds) => Array.from(pageIds))
    )
  );

  if (!allPageIds.length) {
    return itemIdsByTermId;
  }

  const { data: sections, error: sectionsError } = await supabase
    .from("content_theme_sections")
    .select("id, theme_page_id")
    .in("theme_page_id", allPageIds);

  if (sectionsError) {
    console.error("getThemeLinkedContentIdsByCategoryTermIds:sections", sectionsError);
    return itemIdsByTermId;
  }

  const sectionRows = (sections ?? []) as ThemeSectionRow[];
  if (!sectionRows.length) {
    return itemIdsByTermId;
  }

  const termIdsByPageId = new Map<string, string[]>();
  for (const [termId, pageIds] of pageIdsByTermId.entries()) {
    for (const pageId of pageIds) {
      const currentTermIds = termIdsByPageId.get(pageId) ?? [];
      currentTermIds.push(termId);
      termIdsByPageId.set(pageId, currentTermIds);
    }
  }

  const termIdsBySectionId = new Map<string, string[]>();
  for (const section of sectionRows) {
    const pageTermIds = termIdsByPageId.get(section.theme_page_id) ?? [];
    if (!pageTermIds.length) continue;
    termIdsBySectionId.set(section.id, pageTermIds);
  }

  const { data: sectionItems, error: sectionItemsError } = await supabase
    .from("content_theme_section_items")
    .select("theme_section_id, content_item_id")
    .in(
      "theme_section_id",
      sectionRows.map((section) => section.id)
    );

  if (sectionItemsError) {
    console.error(
      "getThemeLinkedContentIdsByCategoryTermIds:sectionItems",
      sectionItemsError
    );
    return itemIdsByTermId;
  }

  for (const sectionItem of (sectionItems ?? []) as ThemeSectionItemRow[]) {
    const sectionTermIds = termIdsBySectionId.get(sectionItem.theme_section_id) ?? [];
    if (!sectionTermIds.length || !sectionItem.content_item_id) continue;

    for (const termId of sectionTermIds) {
      itemIdsByTermId.get(termId)?.add(sectionItem.content_item_id);
    }
  }

  return itemIdsByTermId;
}

async function getFallbackCategoryTermForContentItem(contentItemId: string) {
  const supabase = createAdminClient();
  const { data: sectionItems, error: sectionItemsError } = await supabase
    .from("content_theme_section_items")
    .select("theme_section_id")
    .eq("content_item_id", contentItemId);

  if (sectionItemsError) {
    throw sectionItemsError;
  }

  const sectionIds = Array.from(
    new Set(
      (sectionItems ?? [])
        .map((row) => row.theme_section_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (!sectionIds.length) {
    return null;
  }

  const { data: sections, error: sectionsError } = await supabase
    .from("content_theme_sections")
    .select("id, theme_page_id")
    .in("id", sectionIds);

  if (sectionsError) {
    throw sectionsError;
  }

  const pageIds = Array.from(
    new Set(
      (sections ?? [])
        .map((row) => row.theme_page_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (!pageIds.length) {
    return null;
  }

  const { data: pages, error: pagesError } = await supabase
    .from("content_theme_pages")
    .select("primary_category_term_id, sort_order")
    .in("id", pageIds)
    .eq("is_published", true)
    .not("primary_category_term_id", "is", null)
    .order("sort_order", { ascending: true })
    .limit(1);

  if (pagesError) {
    throw pagesError;
  }

  return pages?.[0]?.primary_category_term_id ?? null;
}

export async function getPublishedContent(categorySlug?: string | null) {
  const supabase = createAdminClient();
  let categoryContentIds: string[] | null = null;

  if (categorySlug) {
    const categoryTaxonomy = await getTaxonomyId("category");
    if (!categoryTaxonomy) return [];

    const { data: term } = await supabase
      .from("content_terms")
      .select("id")
      .eq("taxonomy_id", categoryTaxonomy)
      .eq("slug", categorySlug)
      .maybeSingle<{ id: string }>();

    if (!term?.id) return [];

    const { data: relationships, error: relationshipsError } = await supabase
      .from("content_term_relationships")
      .select("content_item_id")
      .eq("term_id", term.id);

    if (relationshipsError) throw relationshipsError;

    const themeLinkedContentIds =
      (await getThemeLinkedContentIdsByCategoryTermIds([term.id])).get(term.id) ??
      new Set<string>();

    categoryContentIds = Array.from(
      new Set([
        ...(relationships ?? [])
          .map((row) => row.content_item_id)
          .filter((value): value is string => Boolean(value)),
        ...themeLinkedContentIds,
      ])
    );

    if (!categoryContentIds.length) return [];
  }

  let query = supabase
    .from("content_items")
    .select(
      "id, title, slug, excerpt, published_at, language, credit_cost, featured_image_url, featured_image_alt"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (categoryContentIds) {
    query = query.in("id", categoryContentIds);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data ?? [];
}

export async function getHomepageCategories(
  limit = 10,
  options?: { homepageOnly?: boolean }
) {
  const supabase = createAdminClient();
  const categoryTaxonomy = await getTaxonomyId("category");
  if (!categoryTaxonomy) return [];

  let categories:
    | Array<{
        id: string;
        parent_id: string | null;
        is_homepage_seed?: boolean;
        homepage_sort_order?: number | null;
        name: string;
        slug: string;
        description: string | null;
        sort_order: number;
        featured_image_url?: string | null;
        featured_image_alt?: string | null;
      }>
    | null = null;

  let withImageColumnsQuery = supabase
    .from("content_terms")
    .select(
      "id, parent_id, is_homepage_seed, homepage_sort_order, name, slug, description, sort_order, featured_image_url, featured_image_alt"
    )
    .eq("taxonomy_id", categoryTaxonomy)
    .eq("is_active", true);

  if (options?.homepageOnly) {
    withImageColumnsQuery = withImageColumnsQuery.eq("is_homepage_seed", true);
    withImageColumnsQuery = withImageColumnsQuery.order("homepage_sort_order", {
      ascending: true,
      nullsFirst: false,
    });
  }

  withImageColumnsQuery = withImageColumnsQuery.order("sort_order", {
    ascending: true,
  });

  if (!options?.homepageOnly) {
    withImageColumnsQuery = withImageColumnsQuery.order("name", {
      ascending: true,
    });
  }

  const withImageColumns = await withImageColumnsQuery.limit(limit);

  if (withImageColumns.error) {
    // Backward compatible fallback when migration is not applied yet.
    let fallbackQuery = supabase
      .from("content_terms")
      .select("id, parent_id, is_homepage_seed, homepage_sort_order, name, slug, description, sort_order")
      .eq("taxonomy_id", categoryTaxonomy)
      .eq("is_active", true);

    if (options?.homepageOnly) {
      fallbackQuery = fallbackQuery.eq("is_homepage_seed", true);
      fallbackQuery = fallbackQuery.order("homepage_sort_order", {
        ascending: true,
        nullsFirst: false,
      });
    }

    fallbackQuery = fallbackQuery.order("sort_order", { ascending: true });

    if (!options?.homepageOnly) {
      fallbackQuery = fallbackQuery.order("name", { ascending: true });
    }

    const fallback = await fallbackQuery.limit(limit);

    if (fallback.error) throw fallback.error;
    categories = fallback.data ?? [];
  } else {
    categories = withImageColumns.data ?? [];
  }

  if (!categories?.length) return [];

  const themeItemIdsByCategoryId = await getThemeLinkedContentIdsByCategoryTermIds(
    categories.map((category) => category.id)
  );

  const { data: items, error: itemsError } = await supabase
    .from("content_items")
    .select(
      "id, title, slug, excerpt, language, credit_cost, published_at"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (itemsError) throw itemsError;

  const { data: relationships, error: relationshipsError } = await supabase
    .from("content_term_relationships")
    .select("content_item_id, term_id")
    .in(
      "content_item_id",
      (items ?? []).map((item) => item.id)
    );

  if (relationshipsError) throw relationshipsError;

  const itemById = new Map(
    (items ?? []).map((item) => [
      item.id,
      {
        id: item.id,
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        language: item.language,
        credit_cost: item.credit_cost,
      },
    ])
  );

  const itemIdsByCategoryId = createEmptyItemSetMap(categories.map((category) => category.id));
  const categoryIdsByContentItemId = new Map<string, Set<string>>();

  for (const [termId, contentItemIds] of themeItemIdsByCategoryId.entries()) {
    const categoryItemIds = itemIdsByCategoryId.get(termId);
    if (!categoryItemIds) continue;

    for (const contentItemId of contentItemIds) {
      categoryItemIds.add(contentItemId);
      const categoryIds = categoryIdsByContentItemId.get(contentItemId) ?? new Set<string>();
      categoryIds.add(termId);
      categoryIdsByContentItemId.set(contentItemId, categoryIds);
    }
  }

  for (const relationship of relationships ?? []) {
    if (!relationship.term_id || !relationship.content_item_id) {
      continue;
    }

    itemIdsByCategoryId.get(relationship.term_id)?.add(relationship.content_item_id);
    const categoryIds =
      categoryIdsByContentItemId.get(relationship.content_item_id) ?? new Set<string>();
    categoryIds.add(relationship.term_id);
    categoryIdsByContentItemId.set(relationship.content_item_id, categoryIds);
  }

  const firstItemByCategory = new Map<
    string,
    {
      id: string;
      title: string;
      slug: string;
      excerpt: string | null;
      language: string | null;
      credit_cost: number | null;
    }
  >();

  for (const item of items ?? []) {
    const categoryIds = categoryIdsByContentItemId.get(item.id) ?? new Set<string>();
    if (!categoryIds.size) continue;

    const itemSummary = itemById.get(item.id);
    if (!itemSummary) continue;

    for (const categoryId of categoryIds) {
      if (firstItemByCategory.has(categoryId)) continue;
      firstItemByCategory.set(categoryId, itemSummary);
    }
  }

  const rows = categories.map((category) => ({
    ...category,
    itemCount: itemIdsByCategoryId.get(category.id)?.size ?? 0,
    featuredItem: firstItemByCategory.get(category.id) ?? null,
  }));

  return rows;
}

export async function getPublishedContentBySlug(slug: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("getPublishedContentBySlug:", error);
    return null;
  }

  return data;
}

export async function getPublishedBlocks(contentItemId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_blocks")
    .select("*")
    .eq("content_item_id", contentItemId)
    .order("order_index");

  if (error) throw error;
  return data ?? [];
}

export async function getThemeNavigationForContentItem(
  contentItemId: string
): Promise<ThemeItemNavigation | null> {
  const supabase = createAdminClient();

  const { data: currentLinks, error: currentLinksError } = await supabase
    .from("content_theme_section_items")
    .select("theme_section_id, content_item_id, sort_order")
    .eq("content_item_id", contentItemId);

  if (currentLinksError) {
    throw currentLinksError;
  }

  const currentSectionIds = Array.from(
    new Set(
      (currentLinks ?? [])
        .map((row) => row.theme_section_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (!currentSectionIds.length) {
    return null;
  }

  const { data: currentSections, error: currentSectionsError } = await supabase
    .from("content_theme_sections")
    .select("id, theme_page_id, sort_order")
    .in("id", currentSectionIds);

  if (currentSectionsError) {
    throw currentSectionsError;
  }

  const currentPageIds = Array.from(
    new Set(
      (currentSections ?? [])
        .map((row) => row.theme_page_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (!currentPageIds.length) {
    return null;
  }

  const { data: currentPages, error: currentPagesError } = await supabase
    .from("content_theme_pages")
    .select("id, slug, title, sort_order")
    .in("id", currentPageIds)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (currentPagesError) {
    throw currentPagesError;
  }

  const pageById = new Map(
    (currentPages ?? []).map((page) => [page.id, page])
  );

  const candidateRows = (currentLinks ?? [])
    .map((link) => {
      const section = (currentSections ?? []).find(
        (row) => row.id === link.theme_section_id
      );
      const page = section ? pageById.get(section.theme_page_id) ?? null : null;

      if (!section || !page) {
        return null;
      }

      return {
        page,
        section,
        itemSortOrder: link.sort_order ?? 0,
      };
    })
    .filter(
      (
        row
      ): row is {
        page: { id: string; slug: string; title: string; sort_order: number };
        section: { id: string; theme_page_id: string; sort_order: number };
        itemSortOrder: number;
      } => Boolean(row)
    )
    .sort((left, right) => {
      if (left.page.sort_order !== right.page.sort_order) {
        return left.page.sort_order - right.page.sort_order;
      }

      if (left.section.sort_order !== right.section.sort_order) {
        return left.section.sort_order - right.section.sort_order;
      }

      return left.itemSortOrder - right.itemSortOrder;
    });

  const currentTheme = candidateRows[0]?.page;
  if (!currentTheme) {
    return null;
  }

  const { data: themeSections, error: themeSectionsError } = await supabase
    .from("content_theme_sections")
    .select("id, sort_order")
    .eq("theme_page_id", currentTheme.id)
    .order("sort_order", { ascending: true });

  if (themeSectionsError) {
    throw themeSectionsError;
  }

  const themeSectionRows =
    (themeSections as Array<{ id: string; sort_order: number }> | null) ?? [];
  const themeSectionIds = themeSectionRows.map((section) => section.id);

  if (!themeSectionIds.length) {
    return null;
  }

  const { data: themeSectionItems, error: themeSectionItemsError } = await supabase
    .from("content_theme_section_items")
    .select("theme_section_id, content_item_id, custom_title, sort_order")
    .in("theme_section_id", themeSectionIds);

  if (themeSectionItemsError) {
    throw themeSectionItemsError;
  }

  const orderedThemeSectionItems =
    ((themeSectionItems ?? []) as ThemeSectionItemRow[])
      .filter((row) => Boolean(row.content_item_id))
      .sort((left, right) => {
        const leftSectionOrder =
          themeSectionRows.find((section) => section.id === left.theme_section_id)
            ?.sort_order ?? 0;
        const rightSectionOrder =
          themeSectionRows.find((section) => section.id === right.theme_section_id)
            ?.sort_order ?? 0;

        if (leftSectionOrder !== rightSectionOrder) {
          return leftSectionOrder - rightSectionOrder;
        }

        return (left.sort_order ?? 0) - (right.sort_order ?? 0);
      });

  const themeContentIds = Array.from(
    new Set(
      orderedThemeSectionItems
        .map((row) => row.content_item_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (!themeContentIds.length) {
    return null;
  }

  const { data: contentRows, error: contentRowsError } = await supabase
    .from("content_items")
    .select("id, title, slug, language")
    .in("id", themeContentIds)
    .eq("status", "published");

  if (contentRowsError) {
    throw contentRowsError;
  }

  const contentById = new Map(
    (contentRows ?? []).map((item) => [item.id, item])
  );

  const orderedPublishedItems = orderedThemeSectionItems
    .map((row) => {
      const content = contentById.get(row.content_item_id);
      if (!content) {
        return null;
      }

      return {
        id: content.id,
        href: buildContentHref(content),
        title: row.custom_title || content.title || "Ongetitelde content",
      };
    })
    .filter(
      (
        row
      ): row is {
        id: string;
        href: string;
        title: string;
      } => Boolean(row)
    );

  const currentIndex = orderedPublishedItems.findIndex(
    (item) => item.id === contentItemId
  );

  if (currentIndex === -1) {
    return null;
  }

  const previousItem = orderedPublishedItems[currentIndex - 1] ?? null;
  const nextItem = orderedPublishedItems[currentIndex + 1] ?? null;

  if (!previousItem && !nextItem) {
    return null;
  }

  return {
    theme: {
      slug: currentTheme.slug,
      title: currentTheme.title,
    },
    previous: previousItem
      ? {
          href: previousItem.href,
          title: previousItem.title,
        }
      : null,
    next: nextItem
      ? {
          href: nextItem.href,
          title: nextItem.title,
        }
      : null,
  };
}

export async function getPrimaryCategoryForContentItem(contentItemId: string) {
  const supabase = createAdminClient();
  const categoryTaxonomy = await getTaxonomyId("category");
  if (!categoryTaxonomy) return null;

  const { data: relationships, error: relationshipError } = await supabase
    .from("content_term_relationships")
    .select("term_id")
    .eq("content_item_id", contentItemId);

  if (relationshipError) throw relationshipError;
  const termIds = (relationships ?? [])
    .map((row) => row.term_id)
    .filter((termId): termId is string => Boolean(termId));

  const fallbackTermId = termIds.length
    ? null
    : await getFallbackCategoryTermForContentItem(contentItemId);
  const lookupTermIds = termIds.length
    ? termIds
    : fallbackTermId
      ? [fallbackTermId]
      : [];

  if (!lookupTermIds.length) return null;

  const { data: terms, error: termsError } = await supabase
    .from("content_terms")
    .select("id, slug, name, parent_id, sort_order, is_homepage_seed")
    .eq("taxonomy_id", categoryTaxonomy)
    .in("id", lookupTermIds)
    .order("sort_order", { ascending: true })
    .limit(1);

  if (termsError) throw termsError;
  return terms?.[0] ?? null;
}

async function getTaxonomyId(slug: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("content_taxonomies")
    .select("id")
    .eq("slug", slug)
    .maybeSingle<{ id: string }>();

  return data?.id ?? null;
}
