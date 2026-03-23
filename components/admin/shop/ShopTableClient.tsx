"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useEffectEvent,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DeleteShopItemButton from "@/components/admin/shop/DeleteShopItemButton";
import {
  getCatalogItemPath,
  getCatalogStatusLabel,
  isCatalogItemPublic,
} from "@/lib/shop/catalog-shared";
import type { CatalogItem, CatalogStatus } from "@/lib/shop/catalog-shared";
import { resolveAdminBrowserHref } from "@/lib/site/admin-client-paths";

type StatusFilter = "all" | CatalogStatus;
type SortOption =
  | "title_asc"
  | "title_desc"
  | "price_asc"
  | "price_desc"
  | "category_asc"
  | "category_desc";

type ShopTableFilters = {
  search: string;
  status: StatusFilter;
  category: string;
  sort: SortOption;
  currentPage: number;
};

const DEFAULT_SORT: SortOption = "title_asc";

function formatPrice(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function getCategoryLabel(category: CatalogItem["category"]) {
  switch (category) {
    case "boeken":
      return "Boeken";
    case "ebooks":
      return "E-books";
    case "spellen":
      return "Spellen";
    default:
      return category;
  }
}

export default function ShopTableClient({
  items,
  allCategories,
  filters,
  pageSize,
  totalItems,
  totalPages,
  statusCounts,
}: {
  items: CatalogItem[];
  allCategories: { value: string; label: string }[];
  filters: ShopTableFilters;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  statusCounts: Record<StatusFilter, number>;
}) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  function navigate(
    updates: Partial<Record<"s" | "status" | "category" | "sort" | "page", string | null>>,
    options?: {
      resetPage?: boolean;
      scroll?: boolean;
      method?: "push" | "replace";
    }
  ) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      const normalizedValue =
        key === "status" && value === "all"
          ? null
          : key === "sort" && value === DEFAULT_SORT
            ? null
            : key === "page" && value === "1"
              ? null
              : value && value.trim()
                ? value.trim()
                : null;

      if (normalizedValue === null) {
        params.delete(key);
      } else {
        params.set(key, normalizedValue);
      }
    }

    if (options?.resetPage) {
      params.delete("page");
    }

    const nextQuery = params.toString();
    const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    startTransition(() => {
      if (options?.method === "push") {
        router.push(nextHref, { scroll: options?.scroll ?? false });
        return;
      }

      router.replace(nextHref, { scroll: options?.scroll ?? false });
    });
  }

  const syncSearchToUrl = useEffectEvent((nextSearch: string) => {
    navigate(
      { s: nextSearch || null },
      { resetPage: true, scroll: false, method: "replace" }
    );
  });

  useEffect(() => {
    const nextSearch = searchInput.trim();

    if (nextSearch === filters.search) {
      return;
    }

    const timeout = window.setTimeout(() => {
      syncSearchToUrl(nextSearch);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [filters.search, searchInput, syncSearchToUrl]);

  const rangeStart = totalItems === 0 ? 0 : (filters.currentPage - 1) * pageSize + 1;
  const rangeEnd = totalItems === 0 ? 0 : Math.min(filters.currentPage * pageSize, totalItems);
  const paginationItems = buildPagination(filters.currentPage, totalPages);

  return (
    <div className="w-full space-y-3" aria-busy={isPending}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StatusTab
          active={filters.status === "all"}
          onClick={() => navigate({ status: "all" }, { resetPage: true, method: "replace" })}
          label={`Alle (${statusCounts.all})`}
        />
        <Divider />
        <StatusTab
          active={filters.status === "concept"}
          onClick={() => navigate({ status: "concept" }, { resetPage: true, method: "replace" })}
          label={`Concept (${statusCounts.concept})`}
        />
        <Divider />
        <StatusTab
          active={filters.status === "live"}
          onClick={() => navigate({ status: "live" }, { resetPage: true, method: "replace" })}
          label={`Live (${statusCounts.live})`}
        />
        <Divider />
        <StatusTab
          active={filters.status === "in_development"}
          onClick={() =>
            navigate(
              { status: "in_development" },
              { resetPage: true, method: "replace" }
            )
          }
          label={`In ontwikkeling (${statusCounts.in_development})`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.category}
          onChange={(event) =>
            navigate(
              { category: event.target.value || null },
              { resetPage: true, method: "replace" }
            )
          }
          className="border px-2 py-1 text-sm"
          aria-label="Alle categorieen"
        >
          <option value="">Alle categorieen</option>
          {allCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(event) =>
            navigate(
              { sort: event.target.value as SortOption },
              { resetPage: true, method: "replace" }
            )
          }
          className="border px-2 py-1 text-sm"
          aria-label="Sorteer shop-items"
        >
          <option value="title_asc">Titel A-Z</option>
          <option value="title_desc">Titel Z-A</option>
          <option value="price_asc">Prijs laag-hoog</option>
          <option value="price_desc">Prijs hoog-laag</option>
          <option value="category_asc">Categorie A-Z</option>
          <option value="category_desc">Categorie Z-A</option>
        </select>

        <input
          className="min-w-[220px] border px-3 py-1 text-sm sm:ml-auto sm:w-64"
          placeholder="Zoek producten"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>

      <div className={`rounded border bg-white ${isPending ? "opacity-70" : ""}`}>
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-2 text-left">Titel</th>
              <th className="px-2 py-2 text-left">Status</th>
              <th className="px-2 py-2 text-left">Categorie</th>
              <th className="px-2 py-2 text-left">Prijs</th>
              <th className="px-2 py-2 text-left">Productlink</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="group hover:bg-gray-50">
                <td className="px-2 py-2">
                  <div className="flex items-start gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded border bg-stone-100">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.imageAlt || item.title}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-stone-500">
                          Geen afbeelding
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={resolveAdminBrowserHref(pathname, `/admin/shop/${item.id}`)}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {item.title || "—"}
                      </Link>
                      <div className="mt-1 text-xs text-stone-500">
                        {item.id} • {item.format}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                        <Link
                          href={resolveAdminBrowserHref(pathname, `/admin/shop/${item.id}`)}
                          className="text-[#2271b1] hover:underline"
                        >
                          Bewerken
                        </Link>
                        {isCatalogItemPublic(item) ? (
                          <Link
                            href={getCatalogItemPath(item)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-stone-600 hover:underline"
                          >
                            Bekijk
                          </Link>
                        ) : (
                          <span className="text-stone-400">Niet zichtbaar</span>
                        )}
                        <DeleteShopItemButton itemId={item.id} title={item.title} />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-2">{getCatalogStatusLabel(item.status)}</td>
                <td className="px-2 py-2">{getCategoryLabel(item.category)}</td>
                <td className="px-2 py-2">{formatPrice(item.price)}</td>
                <td className="px-2 py-2">
                  {item.href ? "Externe productlink" : "Nog geen productlink"}
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Geen shop-items gevonden.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalItems > 0 && (
          <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {rangeStart}-{rangeEnd} / {totalItems}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <PagerButton
                  disabled={filters.currentPage === 1 || isPending}
                  onClick={() =>
                    navigate(
                      { page: String(filters.currentPage - 1) },
                      { method: "push", scroll: false }
                    )
                  }
                >
                  Vorige
                </PagerButton>

                {paginationItems.map((entry, index) =>
                  typeof entry === "number" ? (
                    <button
                      key={entry}
                      type="button"
                      onClick={() =>
                        navigate(
                          { page: String(entry) },
                          { method: "push", scroll: false }
                        )
                      }
                      disabled={isPending}
                      className={`min-w-9 rounded border px-3 py-1 ${
                        entry === filters.currentPage
                          ? "border-[#2271b1] bg-[#2271b1] text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      } disabled:opacity-50`}
                    >
                      {entry}
                    </button>
                  ) : (
                    <span key={`ellipsis-${index}`} className="px-1 text-gray-400">
                      ...
                    </span>
                  )
                )}

                <PagerButton
                  disabled={filters.currentPage === totalPages || isPending}
                  onClick={() =>
                    navigate(
                      { page: String(filters.currentPage + 1) },
                      { method: "push", scroll: false }
                    )
                  }
                >
                  Volgende
                </PagerButton>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "font-semibold" : "text-blue-600 hover:underline"}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <span className="text-gray-400">|</span>;
}

function PagerButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded border border-gray-300 bg-white px-3 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function buildPagination(currentPage: number, totalPages: number) {
  const pages: Array<number | "ellipsis"> = [];

  for (let page = 1; page <= totalPages; page += 1) {
    const isEdgePage = page === 1 || page === totalPages;
    const isNearCurrentPage = Math.abs(page - currentPage) <= 1;

    if (isEdgePage || isNearCurrentPage) {
      pages.push(page);
      continue;
    }

    if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis");
    }
  }

  return pages;
}
