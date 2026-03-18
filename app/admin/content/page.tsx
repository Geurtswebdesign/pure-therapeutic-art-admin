import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import ContentTableClient from "@/components/content/admin/ContentTableClient";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAdminAreaUrl } from "@/lib/site/urls";

const PAGE_SIZE = 20;

type StatusFilter = "all" | "draft" | "published" | "trash";
type CreditFilter = "all" | "free" | "credits_desc" | "credits_asc";
type SortOption =
  | "updated_desc"
  | "updated_asc"
  | "published_desc"
  | "published_asc"
  | "credits_desc"
  | "credits_asc"
  | "title_asc"
  | "title_desc";

type SearchParamValue = string | string[] | undefined;
type FilterableContentQuery = {
  or: (filters: string) => unknown;
  in: (column: string, values: string[]) => unknown;
  eq: (column: string, value: string) => unknown;
  neq: (column: string, value: string) => unknown;
  gt: (column: string, value: number) => unknown;
};

type PageProps = {
  searchParams: Promise<{
    s?: SearchParamValue;
    status?: SearchParamValue;
    category?: SearchParamValue;
    credits?: SearchParamValue;
    sort?: SearchParamValue;
    page?: SearchParamValue;
  }>;
};

function takeFirst(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeStatusFilter(value: string | undefined): StatusFilter {
  if (value === "draft" || value === "published" || value === "trash") {
    return value;
  }

  return "all";
}

function normalizeCreditFilter(value: string | undefined): CreditFilter {
  if (value === "free" || value === "credits_desc" || value === "credits_asc") {
    return value;
  }

  return "all";
}

function normalizeSortOption(value: string | undefined): SortOption {
  switch (value) {
    case "updated_asc":
    case "published_desc":
    case "published_asc":
    case "credits_desc":
    case "credits_asc":
    case "title_asc":
    case "title_desc":
      return value;
    default:
      return "updated_desc";
  }
}

function parsePageNumber(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export default async function AdminContentPage({ searchParams }: PageProps) {
  const language = resolveUiLanguage(await getPrimaryLanguage());
  const t = getAdminMessages(language).contentPage;
  const supabase = createAdminClient();
  const params = await searchParams;
  const search = takeFirst(params.s)?.trim() ?? "";
  const statusFilter = normalizeStatusFilter(takeFirst(params.status));
  const requestedCategory = takeFirst(params.category)?.trim() ?? "";
  const creditFilter = normalizeCreditFilter(takeFirst(params.credits));
  const sort = normalizeSortOption(takeFirst(params.sort));
  const requestedPage = parsePageNumber(takeFirst(params.page));
  const effectiveSort: SortOption =
    creditFilter === "credits_desc" || creditFilter === "credits_asc"
      ? creditFilter
      : sort;

  let allCategories: { id: string; name: string }[] = [];
  let categoryTaxonomyId: string | null = null;
  let tagTaxonomyId: string | null = null;

  const [{ data: categoryTaxonomy }, { data: tagTaxonomy }] = await Promise.all([
    supabase
      .from("content_taxonomies")
      .select("id")
      .eq("slug", "category")
      .maybeSingle(),
    supabase
      .from("content_taxonomies")
      .select("id")
      .eq("slug", "tag")
      .maybeSingle(),
  ]);

  categoryTaxonomyId = categoryTaxonomy?.id ?? null;
  tagTaxonomyId = tagTaxonomy?.id ?? null;

  if (categoryTaxonomyId) {
    const { data: categories } = await supabase
      .from("content_terms")
      .select("id, name")
      .eq("taxonomy_id", categoryTaxonomyId)
      .order("sort_order", { ascending: true });

    allCategories = categories ?? [];
  }

  const activeCategory = allCategories.some((category) => category.id === requestedCategory)
    ? requestedCategory
    : "";

  let categoryItemIds: string[] | null = null;

  if (activeCategory) {
    const { data: relationships, error: categoryRelationshipsError } = await supabase
      .from("content_term_relationships")
      .select("content_item_id")
      .eq("term_id", activeCategory);

    if (categoryRelationshipsError) {
      throw new Error(t.loadError);
    }

    categoryItemIds = Array.from(
      new Set(
        (relationships ?? [])
          .map((relationship) => relationship.content_item_id)
          .filter((value): value is string => Boolean(value))
      )
    );
  }

  function applyContentFilters<T>(
    query: T,
    status: StatusFilter
  ) {
    let nextQuery = query as unknown as FilterableContentQuery;

    if (search) {
      nextQuery = nextQuery.or(
        `title.ilike.%${search}%,body.ilike.%${search}%`
      ) as FilterableContentQuery;
    }

    if (categoryItemIds !== null) {
      if (categoryItemIds.length === 0) {
        return null;
      }

      nextQuery = nextQuery.in("id", categoryItemIds) as FilterableContentQuery;
    }

    if (creditFilter === "free") {
      nextQuery = nextQuery.or(
        "credit_cost.is.null,credit_cost.eq.0"
      ) as FilterableContentQuery;
    }

    if (creditFilter === "credits_desc" || creditFilter === "credits_asc") {
      nextQuery = nextQuery.gt("credit_cost", 0) as FilterableContentQuery;
    }

    if (status === "all") {
      return nextQuery.neq("status", "trash") as T;
    }

    return nextQuery.eq("status", status) as T;
  }

  async function getStatusCount(status: StatusFilter) {
    const query = applyContentFilters(
      supabase
        .from("content_items")
        .select("id", { count: "exact", head: true }),
      status
    );

    if (!query) {
      return 0;
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(t.loadError);
    }

    return count ?? 0;
  }

  const [allCount, draftCount, publishedCount, trashCount] = await Promise.all([
    getStatusCount("all"),
    getStatusCount("draft"),
    getStatusCount("published"),
    getStatusCount("trash"),
  ]);

  const statusCounts = {
    all: allCount,
    draft: draftCount,
    published: publishedCount,
    trash: trashCount,
  };

  const totalItems =
    statusFilter === "all"
      ? statusCounts.all
      : statusFilter === "draft"
        ? statusCounts.draft
        : statusFilter === "published"
          ? statusCounts.published
          : statusCounts.trash;

  const totalPages = totalItems > 0 ? Math.ceil(totalItems / PAGE_SIZE) : 1;
  const currentPage = Math.min(requestedPage, totalPages);

  const sortConfig: Record<
    SortOption,
    {
      column: "updated_at" | "published_at" | "credit_cost" | "title";
      ascending: boolean;
      nullsFirst?: boolean;
    }
  > = {
    updated_desc: { column: "updated_at", ascending: false },
    updated_asc: { column: "updated_at", ascending: true },
    published_desc: { column: "published_at", ascending: false, nullsFirst: false },
    published_asc: { column: "published_at", ascending: true, nullsFirst: false },
    credits_desc: { column: "credit_cost", ascending: false, nullsFirst: false },
    credits_asc: { column: "credit_cost", ascending: true, nullsFirst: true },
    title_asc: { column: "title", ascending: true },
    title_desc: { column: "title", ascending: false },
  };

  const contentQuery = applyContentFilters(
    supabase
      .from("content_items")
      .select("id, title, body, status, updated_at, published_at, credit_cost"),
    statusFilter
  );

  let itemRows: Array<{
    id: string;
    title: string;
    body?: string | null;
    status: "draft" | "published" | "trash";
    updated_at: string;
    published_at?: string | null;
    credit_cost: number;
  }> = [];

  if (contentQuery) {
    const { column, ascending, nullsFirst } = sortConfig[effectiveSort];
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let orderedQuery = contentQuery.order(column, {
      ascending,
      ...(nullsFirst === undefined ? {} : { nullsFirst }),
    });

    if (column !== "updated_at") {
      orderedQuery = orderedQuery.order("updated_at", { ascending: false });
    }

    const { data: items, error } = await orderedQuery.range(from, to);

    if (error) {
      throw new Error(t.loadError);
    }

    itemRows = ((items ?? []) as Array<{
      id: string;
      title: string;
      body?: string | null;
      status: "draft" | "published" | "trash";
      updated_at: string;
      published_at?: string | null;
      credit_cost?: number | null;
    }>).map((item) => ({
      ...item,
      credit_cost: item.credit_cost ?? 0,
    }));
  }

  const itemsWithTerms = itemRows.map((item) => ({
    ...item,
    content_categories: [] as { name: string }[],
    content_tags: [] as { name: string }[],
    categories: [] as { id: string; name: string }[],
    tags: [] as string[],
    content: item.body ?? null,
  }));

  if (itemRows.length && (categoryTaxonomyId || tagTaxonomyId)) {
    const { data: relationships, error: relationshipsError } = await supabase
      .from("content_term_relationships")
      .select("content_item_id, term_id")
      .in(
        "content_item_id",
        itemRows.map((item) => item.id)
      );

    if (relationshipsError) {
      throw new Error(t.loadError);
    }

    const termIds = Array.from(
      new Set(
        (relationships ?? [])
          .map((relationship) => relationship.term_id)
          .filter((value): value is string => Boolean(value))
      )
    );

    if (termIds.length) {
      const { data: terms, error: termsError } = await supabase
        .from("content_terms")
        .select("id, name, taxonomy_id")
        .in("id", termIds);

      if (termsError) {
        throw new Error(t.loadError);
      }

      const termById = new Map(
        (terms ?? []).map((term) => [term.id, term])
      );
      const itemsById = new Map(
        itemsWithTerms.map((item) => [item.id, item])
      );

      for (const relationship of relationships ?? []) {
        const item = itemsById.get(relationship.content_item_id);
        const term = termById.get(relationship.term_id);

        if (!item || !term) continue;

        if (categoryTaxonomyId && term.taxonomy_id === categoryTaxonomyId) {
          item.content_categories.push({ name: term.name });
          item.categories.push({ id: term.id, name: term.name });
        }

        if (tagTaxonomyId && term.taxonomy_id === tagTaxonomyId) {
          item.content_tags.push({ name: term.name });
          item.tags.push(term.name);
        }
      }
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* =========================
         Header (WP-style)
         ========================= */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t.title}</h1>

        <Link
          href={getAdminAreaUrl("/content/new")}
          className="rounded bg-[#2271b1] px-4 py-2 text-sm font-medium text-white hover:bg-[#135e96]"
        >
          {t.newPage}
        </Link>
      </div>

      {/* =========================
         Tabel
         ========================= */}
      {/* Header + zoekveld zit in client */}
      <ContentTableClient
        items={itemsWithTerms}
        allCategories={allCategories}
        language={language}
        filters={{
          search,
          status: statusFilter,
          category: activeCategory,
          credits: creditFilter,
          sort: effectiveSort,
          currentPage,
        }}
        pageSize={PAGE_SIZE}
        totalItems={totalItems}
        totalPages={totalPages}
        statusCounts={statusCounts}
      />
    </div>
  );
}
