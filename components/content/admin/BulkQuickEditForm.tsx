"use client";

import { useMemo, useState } from "react";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";
import type { QuickEditPatch } from "@/lib/content/actions/quickEditContentItem";

type BulkStatus = "" | "draft" | "published";

type Props = {
  selectedCount: number;
  allCategories?: { id: string; name: string }[];
  language: UiLanguage;
  onCancel: () => void;
  onSave: (patch: QuickEditPatch) => Promise<void>;
};

export default function BulkQuickEditForm({
  selectedCount,
  allCategories,
  language,
  onCancel,
  onSave,
}: Props) {
  const t = getAdminMessages(language).quickEditForm;
  const [status, setStatus] = useState<BulkStatus>("");
  const [date, setDate] = useState("");
  const [clearDate, setClearDate] = useState(false);
  const [creditCost, setCreditCost] = useState("");
  const [replaceCategories, setReplaceCategories] = useState(false);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(() => {
    return (
      status !== "" ||
      date !== "" ||
      clearDate ||
      creditCost.trim() !== "" ||
      replaceCategories
    );
  }, [clearDate, creditCost, date, replaceCategories, status]);

  async function handleSave() {
    if (!hasChanges) {
      return;
    }

    setSaving(true);

    try {
      const trimmedCreditCost = creditCost.trim();

      await onSave({
        status: status || undefined,
        published_at: clearDate ? null : date || undefined,
        credit_cost:
          trimmedCreditCost === "" ? undefined : Number(trimmedCreditCost),
        category_ids: replaceCategories ? categoryIds : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded border border-blue-200 bg-blue-50 p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            {t.bulkEditTitle} ({selectedCount})
          </h2>
          <p className="text-sm text-gray-600">{t.bulkEditHint}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t.status}</label>
            <select
              className="w-full border px-3 py-1 text-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value as BulkStatus)}
            >
              <option value="">{t.keepCurrent}</option>
              <option value="draft">{t.draft}</option>
              <option value="published">{t.published}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{t.date}</label>
            <input
              type="date"
              className="w-full border px-3 py-1 text-sm"
              value={date}
              disabled={clearDate}
              onChange={(event) => setDate(event.target.value)}
            />
            <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={clearDate}
                onChange={(event) => setClearDate(event.target.checked)}
              />
              {t.clearDate}
            </label>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              {t.creditCost}
            </label>
            <input
              type="number"
              min={0}
              value={creditCost}
              onChange={(event) => setCreditCost(event.target.value)}
              placeholder={t.keepCurrent}
              className="w-full border px-3 py-1 text-sm"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={replaceCategories}
              onChange={(event) => setReplaceCategories(event.target.checked)}
            />
            {t.replaceCategories}
          </label>

          <div
            className={`max-h-48 overflow-auto rounded border p-2 text-sm space-y-1 ${
              replaceCategories ? "bg-white" : "bg-gray-100 text-gray-400"
            }`}
          >
            {(allCategories ?? []).map((category) => (
              <label key={category.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled={!replaceCategories}
                  checked={categoryIds.includes(category.id)}
                  onChange={(event) =>
                    setCategoryIds((prev) =>
                      event.target.checked
                        ? [...prev, category.id]
                        : prev.filter((id) => id !== category.id)
                    )
                  }
                />
                {category.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="rounded bg-blue-600 px-4 py-1 text-sm text-white disabled:opacity-50"
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
