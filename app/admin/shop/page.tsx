import Link from "next/link";
import ShopTableClient from "@/components/admin/shop/ShopTableClient";
import { getShopCatalogSettings } from "@/lib/settings/actions";
import { type CatalogItem, type CatalogStatus, getAllCatalogItems } from "@/lib/shop/catalog";
import { getAdminAreaUrl } from "@/lib/site/urls";

const PAGE_SIZE = 20;

type StatusFilter = "all" | CatalogStatus;
type SortOption =
  | "title_asc"
  | "title_desc"
  | "price_asc"
  | "price_desc"
  | "category_asc"
  | "category_desc";

type SearchParamValue = string | string[] | undefined;

type PageProps = {
  searchParams: Promise<{
    s?: SearchParamValue;
    status?: SearchParamValue;
    category?: SearchParamValue;
    sort?: SearchParamValue;
    page?: SearchParamValue;
  }>;
};

function takeFirst(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeStatusFilter(value: string | undefined): StatusFilter {
  if (value === "concept" || value === "live" || value === "in_development") {
    return value;
  }

  return "all";
}

function normalizeSortOption(value: string | undefined): SortOption {
  switch (value) {
    case "title_desc":
    case "price_asc":
    case "price_desc":
    case "category_asc":
    case "category_desc":
      return value;
    default:
      return "title_asc";
  }
}

function parsePageNumber(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function compareItems(a: CatalogItem, b: CatalogItem, sort: SortOption) {
  switch (sort) {
    case "title_desc":
      return b.title.localeCompare(a.title, "nl");
    case "price_asc":
      return a.price - b.price;
    case "price_desc":
      return b.price - a.price;
    case "category_asc":
      return a.category.localeCompare(b.category, "nl") || a.title.localeCompare(b.title, "nl");
    case "category_desc":
      return b.category.localeCompare(a.category, "nl") || a.title.localeCompare(b.title, "nl");
    case "title_asc":
    default:
      return a.title.localeCompare(b.title, "nl");
  }
}

export default async function AdminShopPage({ searchParams }: PageProps) {
  const settings = await getShopCatalogSettings();
  const allItems = getAllCatalogItems(settings);
  const params = await searchParams;
  const search = takeFirst(params.s)?.trim() ?? "";
  const statusFilter = normalizeStatusFilter(takeFirst(params.status));
  const requestedCategory = takeFirst(params.category)?.trim() ?? "";
  const sort = normalizeSortOption(takeFirst(params.sort));
  const requestedPage = parsePageNumber(takeFirst(params.page));
  const allCategories = [
    { value: "boeken", label: "Boeken" },
    { value: "ebooks", label: "E-books" },
    { value: "spellen", label: "Spellen" },
  ] as const;
  const activeCategory = allCategories.some(
    (category) => category.value === requestedCategory
  )
    ? requestedCategory
    : "";

  const normalizedSearch = search.toLowerCase();

  const statusCounts = {
    all: allItems.length,
    concept: allItems.filter((item) => item.status === "concept").length,
    live: allItems.filter((item) => item.status === "live").length,
    in_development: allItems.filter((item) => item.status === "in_development").length,
  } satisfies Record<StatusFilter, number>;

  const filteredItems = allItems
    .filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (activeCategory && item.category !== activeCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        item.title,
        item.id,
        item.description,
        item.format,
        item.tag,
        item.body,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    })
    .sort((a, b) => compareItems(a, b, sort));

  const totalItems = filteredItems.length;
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / PAGE_SIZE) : 1;
  const currentPage = Math.min(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const items = filteredItems.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Shop</h1>
          <p className="text-sm text-gray-600">
            Beheer hier de shop-items voor boeken, e-books en spellen.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={getAdminAreaUrl("/shop/new")}
            className="rounded border border-[#2271b1] px-4 py-2 text-sm font-medium text-[#2271b1] hover:bg-[#eef6fb]"
          >
            Nieuw product
          </Link>
          <Link
            href="/shop"
            className="rounded bg-[#2271b1] px-4 py-2 text-sm font-medium text-white hover:bg-[#135e96]"
          >
            Bekijk shop
          </Link>
        </div>
      </div>

      <ShopTableClient
        items={items}
        filters={{
          search,
          status: statusFilter,
          category: activeCategory,
          sort,
          currentPage,
        }}
        allCategories={allCategories.map((category) => ({
          value: category.value,
          label: category.label,
        }))}
        totalItems={totalItems}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        statusCounts={statusCounts}
      />
    </div>
  );
}
