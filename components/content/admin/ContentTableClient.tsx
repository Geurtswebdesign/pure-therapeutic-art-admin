"use client";

import { useState, useMemo, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import ContentRowActions from "@/components/content/admin/ContentRowActions";
import {
  bulkTrashContent,
  bulkRestoreContent,
  bulkDeleteContent,
} from "@/components/content/admin/actions";
import BulkDeleteModal from "@/components/content/admin/BulkDeleteModal";
import QuickEditForm from "./QuickEditForm";
import type { QuickEditPatch } from "./QuickEditForm";
import { quickEditContentItem } from "@/lib/content/actions/quickEditContentItem";

/* =========================
   Types
   ========================= */

type ContentStatus = "draft" | "published" | "trash";
type StatusFilter = "all" | ContentStatus;

type ContentItem = {
  id: string;
  title: string;
  content?: string | null;
  status: ContentStatus;
  updated_at: string;
  published_at?: string | null; // ✅ toevoegen
  content_categories?: { name: string }[] | null;
  content_tags?: { name: string }[] | null;
};

type ColumnKey = "status" | "categories" | "tags" | "date";

/* =========================
   Component
   ========================= */

export default function ContentTableClient({
  items,
  allCategories,
}: {
  items: ContentItem[];
  allCategories: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [bulkAction, setBulkAction] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const router = useRouter();

  /* =========================
     Kolommen tonen / verbergen
     ========================= */
  const visibleColumns: Record<ColumnKey, boolean> = {
    status: true,
    categories: true,
    tags: true,
    date: true,
  };

  /* =========================
     Debounced search
     ========================= */
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim().toLowerCase());
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* =========================
     Status counts
     ========================= */
  const counts = useMemo(() => {
    return {
      all: items.filter((i) => i.status !== "trash").length,
      draft: items.filter((i) => i.status === "draft").length,
      published: items.filter((i) => i.status === "published").length,
      trash: items.filter((i) => i.status === "trash").length,
    };
  }, [items]);

  /* =========================
     Filtering
     ========================= */
  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus =
        statusFilter === "all"
          ? item.status !== "trash"
          : item.status === statusFilter;

      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search) ||
        item.content?.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [items, search, statusFilter]);

  /* =========================
     Selection helpers
     ========================= */
  function toggleAll(checked: boolean) {
    setSelected(checked ? filtered.map((i) => i.id) : []);
  }

  function toggleOne(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  /* =========================
     Bulk actions (WP-logic)
     ========================= */
  async function applyBulkAction() {
    if (selected.length === 0) return;

    // 👉 Direct uitvoeren (geen modal)
    if (bulkAction === "restore") {
      setLoading(true);
      await bulkRestoreContent(selected);
      location.reload();
      return;
    }

    // 👉 Acties met bevestiging
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

  /* =========================
     Render
     ========================= */
  return (
    <>
      <div className="space-y-3 w-full">

        {/* ===== Status tabs ===== */}
        <div className="flex items-center gap-2 text-sm">
          <StatusTab active={statusFilter === "all"} onClick={() => setStatusFilter("all")} label={`Alle (${counts.all})`} />
          <Divider />
          <StatusTab active={statusFilter === "draft"} onClick={() => setStatusFilter("draft")} label={`Concept (${counts.draft})`} />
          <Divider />
          <StatusTab active={statusFilter === "published"} onClick={() => setStatusFilter("published")} label={`Gepubliceerd (${counts.published})`} />
          <Divider />
          <StatusTab active={statusFilter === "trash"} onClick={() => setStatusFilter("trash")} label={`Prullenbak (${counts.trash})`} />
        </div>

        {/* ===== Bulk + Search ===== */}
        <div className="flex items-center gap-3">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="border px-2 py-1 text-sm"
          >
            <option value="">Bulkacties</option>

            {statusFilter === "trash" ? (
              <>
                <option value="restore">Herstellen</option>
                <option value="delete-permanent">Permanent verwijderen</option>
              </>
            ) : (
              <option value="trash">Verplaatsen naar prullenbak</option>
            )}
          </select>

          <button
            onClick={applyBulkAction}
            disabled={!bulkAction || selected.length === 0}
            className="border px-3 py-1 text-sm disabled:opacity-50"
          >
            Toepassen
          </button>

          <input
            className="ml-auto border px-3 py-1 text-sm w-64"
            placeholder="Berichten zoeken"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setSelected([]);
            }}
          />
        </div>

        {/* ===== Table ===== */}
        <div className="border rounded bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.length === filtered.length}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                <th className="text-left px-2 py-2">Titel</th>
                {visibleColumns.status && <th className="px-2 py-2">Status</th>}
                {visibleColumns.categories && <th className="px-2 py-2">Categorieën</th>}
                {visibleColumns.tags && <th className="px-2 py-2">Tags</th>}
                {visibleColumns.date && <th className="px-2 py-2">Datum</th>}
              </tr>
            </thead>

            <tbody>
              {filtered.map((item) => (
                <Fragment key={item.id}>
                  <tr className="hover:bg-gray-50 group">
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => toggleOne(item.id)}
                      />
                    </td>

                    <td className="px-2 py-2">
                      <div className="font-medium text-blue-600">
                        {item.title}
                      </div>

                      <ContentRowActions
                        id={item.id}
                        status={item.status}
                        onQuickEdit={() =>
                          setQuickEditId((prev) =>
                            prev === item.id ? null : item.id
                          )
                        }
                      />
                    </td>

                    {visibleColumns.status && (
                      <td className="px-2 py-2 capitalize">
                        {item.status}
                      </td>
                    )}

                    {visibleColumns.categories && (
                      <td className="px-2 py-2">
                        {item.content_categories?.map((c) => c.name).join(", ") || "—"}
                      </td>
                    )}

                    {visibleColumns.tags && (
                      <td className="px-2 py-2">
                        {item.content_tags?.map((t) => t.name).join(", ") || "—"}
                      </td>
                    )}

                    {visibleColumns.date && (
                      <td className="px-2 py-2">
                        {item.published_at
                          ? new Date(item.published_at).toLocaleDateString("nl-NL")
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

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Geen content gevonden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Confirm modal ===== */}
      {showConfirmModal && (
        <BulkDeleteModal
          count={selected.length}
          loading={loading}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={confirmAction}
        />
      )}
    </>
  );
}

/* =========================
   Helpers
   ========================= */

function StatusTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={active ? "font-semibold" : "text-blue-600 hover:underline"}>
      {label}
    </button>
  );
}

function Divider() {
  return <span className="text-gray-400">|</span>;
}
