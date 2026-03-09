"use server";

import { createAdminClient } from "@/lib/supabase/admin";

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

    categoryContentIds = Array.from(
      new Set(
        (relationships ?? [])
          .map((row) => row.content_item_id)
          .filter((value): value is string => Boolean(value))
      )
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

export async function getHomepageCategories(limit = 10, slugs?: readonly string[]) {
  const supabase = createAdminClient();
  const categoryTaxonomy = await getTaxonomyId("category");
  if (!categoryTaxonomy) return [];

  let categories:
    | Array<{
        id: string;
        parent_id: string | null;
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
      "id, parent_id, name, slug, description, sort_order, featured_image_url, featured_image_alt"
    )
    .eq("taxonomy_id", categoryTaxonomy)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (slugs?.length) {
    withImageColumnsQuery = withImageColumnsQuery.in("slug", [...slugs]);
  }

  const withImageColumns = await withImageColumnsQuery.limit(limit);

  if (withImageColumns.error) {
    // Backward compatible fallback when migration is not applied yet.
    let fallbackQuery = supabase
      .from("content_terms")
      .select("id, parent_id, name, slug, description, sort_order")
      .eq("taxonomy_id", categoryTaxonomy)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (slugs?.length) {
      fallbackQuery = fallbackQuery.in("slug", [...slugs]);
    }

    const fallback = await fallbackQuery.limit(limit);

    if (fallback.error) throw fallback.error;
    categories = fallback.data ?? [];
  } else {
    categories = withImageColumns.data ?? [];
  }

  if (!categories?.length) return [];

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

  for (const relationship of relationships ?? []) {
    if (!relationship.term_id || firstItemByCategory.has(relationship.term_id)) {
      continue;
    }

    const item = itemById.get(relationship.content_item_id);
    if (!item) continue;
    firstItemByCategory.set(relationship.term_id, item);
  }

  const rows = categories.map((category) => ({
    ...category,
    itemCount: firstItemByCategory.has(category.id) ? 1 : 0,
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

async function getTaxonomyId(slug: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("content_taxonomies")
    .select("id")
    .eq("slug", slug)
    .maybeSingle<{ id: string }>();

  return data?.id ?? null;
}
