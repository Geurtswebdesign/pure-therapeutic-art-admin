"use client";

import {
  Fragment,
  useEffect,
  useEffectEvent,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ContentRowActions from "@/components/content/admin/ContentRowActions";
import {
  bulkTrashContent,
  bulkRestoreContent,
  bulkDeleteContent,
} from "@/components/content/admin/actions";
import BulkDeleteModal from "@/components/content/admin/BulkDeleteModal";
import BulkQuickEditForm from "./BulkQuickEditForm";
import QuickEditForm from "./QuickEditForm";
import type { QuickEditPatch } from "./QuickEditForm";
import {
  bulkQuickEditContentItems,
  quickEditContentItem,
} from "@/lib/content/actions/quickEditContentItem";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";

type ContentStatus = "draft" | "published" | "trash";
type StatusFilter = "all" | ContentStatus;
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

type ContentItem = {
  id: string;
  title: string;
  content?: string | null;
  status: ContentStatus;
  updated_at: string;
  published_at?: string | null;
  credit_cost: number;
  content_categories?: { name: string }[];
  content_tags?: { name: string }[];
  categories?: { id: string; name: string }[];
  tags?: string[];
};

type ContentTableFilters = {
  search: string;
  status: StatusFilter;
  category: string;
  credits: CreditFilter;
  sort: SortOption;
  currentPage: number;
};

type ColumnKey = "status" | "categories" | "tags" | "date";

const DEFAULT_SORT: SortOption = "updated_desc";

export default function ContentTableClient({
  items,
  allCategories = [],
  language,
  filters,
  pageSize,
  totalItems,
  totalPages,
  statusCounts,
}: {
  items: ContentItem[];
  allCategories?: { id: string; name: string }[];
  language: UiLanguage;
  filters: ContentTableFilters;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  statusCounts: Record<StatusFilter, number>;
}) {
  const t = getAdminMessages(language).contentTable;
  const locale = language === "en" ? "en-US" : language === "de" ? "de-DE" : "nl-NL";
  const [selected, setSelected] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState(filters.search);
  const [bulkAction, setBulkAction] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBulkQuickEdit, setShowBulkQuickEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const visibleColumns: Record<ColumnKey, boolean> = {
    status: true,
    categories: true,
    tags: true,
    date: true,
  };

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    setSelected([]);
    setBulkAction("");
    setQuickEditId(null);
    setShowBulkQuickEdit(false);
  }, [items]);

  useEffect(() => {
    if (selected.length === 0) {
      setShowBulkQuickEdit(false);
    }
  }, [selected.length]);

  function navigate(
    updates: Partial<Record<"s" | "status" | "category" | "credits" | "sort" | "page", string | null>>,
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
          : key === "credits" && value === "all"
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
  }, [filters.search, pathname, searchInput, searchParams]);

  function toggleAll(checked: boolean) {
    setSelected(checked ? items.map((item) => item.id) : []);
  }

  function toggleOne(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((value) => value !== id)
        : [...prev, id]
    );
  }

  async function applyBulkAction() {
    if (selected.length === 0) return;

    if (bulkAction === "restore") {
      setLoading(true);
      await bulkRestoreContent(selected);
      location.reload();
      return;
    }

    if (bulkAction === "quick-edit") {
      setQuickEditId(null);
      setShowBulkQuickEdit(true);
      return;
    }

    if (bulkAction === "trash" || bulkAction === "delete-permanent") {
      setShowConfirmModal(true);
    }
  }

  async function confirmAction() {
    setLoading(true);

    try {
      if (bulkAction === "trash") {
        await bulkTrashContent(selected);
      }

      if (bulkAction === "delete-permanent") {
        await bulkDeleteContent(selected);
      }

      setSelected([]);
      setShowConfirmModal(false);
      location.reload();
    } finally {
      setLoading(false);
    }
  }

  const rangeStart = totalItems === 0 ? 0 : (filters.currentPage - 1) * pageSize + 1;
  const rangeEnd = totalItems === 0 ? 0 : Math.min(filters.currentPage * pageSize, totalItems);
  const paginationItems = buildPagination(filters.currentPage, totalPages);

  return (
    <>
      <div className="w-full space-y-3" aria-busy={isPending}>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <StatusTab
            active={filters.status === "all"}
            onClick={() => navigate({ status: "all" }, { resetPage: true, method: "replace" })}
            label={`${t.all} (${statusCounts.all})`}
          />
          <Divider />
          <StatusTab
            active={filters.status === "draft"}
            onClick={() => navigate({ status: "draft" }, { resetPage: true, method: "replace" })}
            label={`${t.draft} (${statusCounts.draft})`}
          />
          <Divider />
          <StatusTab
            active={filters.status === "published"}
            onClick={() => navigate({ status: "published" }, { resetPage: true, method: "replace" })}
            label={`${t.published} (${statusCounts.published})`}
          />
          <Divider />
          <StatusTab
            active={filters.status === "trash"}
            onClick={() => navigate({ status: "trash" }, { resetPage: true, method: "replace" })}
            label={`${t.trash} (${statusCounts.trash})`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={bulkAction}
            onChange={(event) => {
              const nextValue = event.target.value;
              setBulkAction(nextValue);

              if (nextValue !== "quick-edit") {
                setShowBulkQuickEdit(false);
              }
            }}
            className="border px-2 py-1 text-sm"
          >
            <option value="">{t.bulkActions}</option>

            {filters.status === "trash" ? (
              <>
                <option value="restore">{t.restore}</option>
                <option value="delete-permanent">{t.deletePermanent}</option>
              </>
            ) : (
              <>
                <option value="quick-edit">{t.quickEdit}</option>
                <option value="trash">{t.moveToTrash}</option>
              </>
            )}
          </select>

          <button
            onClick={applyBulkAction}
            disabled={!bulkAction || selected.length === 0}
            className="border px-3 py-1 text-sm disabled:opacity-50"
          >
            {t.apply}
          </button>

          <select
            value={filters.category}
            onChange={(event) =>
              navigate(
                { category: event.target.value || null },
                { resetPage: true, method: "replace" }
              )
            }
            className="border px-2 py-1 text-sm"
            aria-label={t.allCategories}
          >
            <option value="">{t.allCategories}</option>
            {allCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={filters.credits}
            onChange={(event) =>
              navigate(
                { credits: event.target.value || null },
                { resetPage: true, method: "replace" }
              )
            }
            className="border px-2 py-1 text-sm"
            aria-label={t.creditsLabel}
          >
            <option value="all">{t.allCredits}</option>
            <option value="free">{t.freeOnly}</option>
            <option value="credits_desc">{t.creditRangeHighLow}</option>
            <option value="credits_asc">{t.creditRangeLowHigh}</option>
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
            aria-label={t.sortLabel}
          >
            <option value="updated_desc">{t.sortUpdatedDesc}</option>
            <option value="updated_asc">{t.sortUpdatedAsc}</option>
            <option value="published_desc">{t.sortPublishedDesc}</option>
            <option value="published_asc">{t.sortPublishedAsc}</option>
            <option value="title_asc">{t.sortTitleAsc}</option>
            <option value="title_desc">{t.sortTitleDesc}</option>
          </select>

          <input
            className="min-w-[220px] border px-3 py-1 text-sm sm:ml-auto sm:w-64"
            placeholder={t.searchPlaceholder}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>

        {showBulkQuickEdit && (
          <BulkQuickEditForm
            selectedCount={selected.length}
            allCategories={allCategories}
            language={language}
            onCancel={() => {
              setShowBulkQuickEdit(false);
              setBulkAction("");
            }}
            onSave={async (patch) => {
              await bulkQuickEditContentItems(selected, patch);
              setShowBulkQuickEdit(false);
              setBulkAction("");
              setSelected([]);
              router.refresh();
            }}
          />
        )}

        <div className={`rounded border bg-white ${isPending ? "opacity-70" : ""}`}>
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selected.length === items.length}
                    onChange={(event) => toggleAll(event.target.checked)}
                  />
                </th>
                <th className="px-2 py-2 text-left">{t.title}</th>
                {visibleColumns.status && <th className="px-2 py-2">{t.status}</th>}
                {visibleColumns.categories && <th className="px-2 py-2">{t.categories}</th>}
                {visibleColumns.tags && <th className="px-2 py-2">{t.tags}</th>}
                {visibleColumns.date && <th className="px-2 py-2">{t.date}</th>}
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <Fragment key={item.id}>
                  <tr className="group hover:bg-gray-50">
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => toggleOne(item.id)}
                      />
                    </td>

                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/content/${item.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {item.title || "—"}
                        </Link>

                        {item.credit_cost > 0 && (
                          <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                            🔒 {item.credit_cost} {t.creditsSuffix}
                          </span>
                        )}
                      </div>

                      <ContentRowActions
                        id={item.id}
                        status={item.status}
                        language={language}
                        onQuickEdit={() => {
                          setShowBulkQuickEdit(false);
                          setBulkAction("");
                          setQuickEditId((prev) => (prev === item.id ? null : item.id));
                        }}
                      />
                    </td>

                    {visibleColumns.status && (
                      <td className="px-2 py-2 capitalize">
                        {item.status}
                      </td>
                    )}

                    {visibleColumns.categories && (
                      <td className="px-2 py-2">
                        {item.content_categories?.map((category) => category.name).join(", ") || "—"}
                      </td>
                    )}

                    {visibleColumns.tags && (
                      <td className="px-2 py-2">
                        {item.content_tags?.map((tag) => tag.name).join(", ") || "—"}
                      </td>
                    )}

                    {visibleColumns.date && (
                      <td className="px-2 py-2">
                        {item.published_at
                          ? new Date(item.published_at).toLocaleDateString(locale)
                          : "—"}
                      </td>
                    )}
                  </tr>

                  {quickEditId === item.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={6}>
                        <QuickEditForm
                          item={item}
                          allCategories={allCategories}
                          language={language}
                          onCancel={() => setQuickEditId(null)}
                          onSave={async (patch: QuickEditPatch) => {
                            await quickEditContentItem(item.id, patch);
                            setQuickEditId(null);
                            router.refresh();
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    {t.noContentFound}
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
                    {t.previous}
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
                    {t.next}
                  </PagerButton>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showConfirmModal && (
        <BulkDeleteModal
          count={selected.length}
          language={language}
          loading={loading}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={confirmAction}
        />
      )}
    </>
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
