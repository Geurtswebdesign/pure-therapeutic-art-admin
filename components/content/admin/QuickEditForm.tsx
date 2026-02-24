"use client";

import { useState } from "react";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";

type ContentStatus = "draft" | "published" | "trash";

export type QuickEditPatch = {
  title?: string;
  status?: ContentStatus;
  published_at?: string | null;   // ← TOEVOEGEN
  category_ids?: string[];
  credit_cost?: number;
  tags?: string[];
};

type Props = {
  item: {
    id: string;
    title: string;
    status: ContentStatus;
    published_at?: string | null;
    credit_cost?: number;   // 👈 toevoegen
    categories?: { id: string; name: string }[];
    tags?: string[];
  };
  allCategories?: { id: string; name: string }[];
  language: UiLanguage;
  onCancel: () => void;
  onSave: (patch: QuickEditPatch) => Promise<void>;
};

export default function QuickEditForm({
  item,
  allCategories,
  language,
  onCancel,
  onSave,
}: Props) {
  const t = getAdminMessages(language).quickEditForm;
  const [title, setTitle] = useState(item.title);
  const [status, setStatus] = useState<ContentStatus>(
    item.status === "trash" ? "draft" : item.status
  );
  const [date, setDate] = useState(
    item.published_at
      ? item.published_at.slice(0, 10)
      : ""
  );
  const [categoryIds, setCategoryIds] = useState<string[]>(
    item.categories?.map((c) => c.id) ?? []
  );
  const [creditCost, setCreditCost] = useState<number>(
    item.credit_cost ?? 0
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const originalCategoryIds =
        item.categories?.map((c) => c.id) ?? [];

      await onSave({
        title: title !== item.title ? title : undefined,
        status:
          status !== item.status && item.status !== "trash"
            ? status
            : undefined,
        published_at:
          date !== (item.published_at?.slice(0, 10) ?? "")
            ? date || null
            : undefined,
        category_ids:
          JSON.stringify(categoryIds) !==
          JSON.stringify(originalCategoryIds)
            ? categoryIds
            : undefined,
        credit_cost:
          creditCost !== (item.credit_cost ?? 0)
            ? creditCost
            : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 bg-gray-50 border-t">
      <div className="grid grid-cols-2 gap-6">

        {/* === Linkerkolom === */}
        <div className="space-y-3">
          <label className="block text-sm font-medium">{t.title}</label>
          <input
            className="w-full border px-3 py-1 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              {t.creditCost}
            </label>

            <input
              type="number"
              min={0}
              value={creditCost}
              onChange={(e) => setCreditCost(Number(e.target.value))}
              className="border rounded px-2 py-1 w-24"
            />
          </div>
          
          <label className="block text-sm font-medium">{t.date}</label>
            <input
              type="date"
              className="w-full border px-3 py-1 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
        </div>

        {/* === Rechterkolom === */}
        <div className="space-y-3">
          <label className="block text-sm font-medium">{t.status}</label>
          <select
            className="w-full border px-3 py-1 text-sm"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as ContentStatus)
            }
          >
            <option value="draft">{t.draft}</option>
            <option value="published">{t.published}</option>
          </select>

          <label className="block text-sm font-medium">{t.categories}</label>
          <div className="max-h-32 overflow-auto border rounded p-2 text-sm space-y-1">
          {(allCategories ?? []).map((cat) => (
              <label key={cat.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={categoryIds.includes(cat.id)}
                  onChange={(e) =>
                    setCategoryIds((prev) =>
                      e.target.checked
                        ? [...prev, cat.id]
                        : prev.filter((id) => id !== cat.id)
                    )
                  }
                />
                {cat.name}
              </label>
            ))}
          </div>
        </div>
      </div>
            
      {/* === Acties === */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-1 text-sm rounded disabled:opacity-50"
        >
          {t.update}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-600 hover:underline"
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
}
