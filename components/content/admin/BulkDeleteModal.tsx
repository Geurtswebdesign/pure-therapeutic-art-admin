"use client";

import { getAdminMessages } from "@/lib/i18n/adminMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Props = {
  count: number;
  language: UiLanguage;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export default function BulkDeleteModal({
  count,
  language,
  onConfirm,
  onCancel,
  loading,
}: Props) {
  const t = getAdminMessages(language).bulkDeleteModal;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold mb-2">
          {t.title}
        </h2>

        <p className="text-sm text-gray-700 mb-4">
          {t.message.replace("{count}", String(count))}
          <br />
          <span className="text-red-600">
            {t.irreversible}
          </span>
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="border px-3 py-1.5 text-sm rounded hover:bg-gray-100"
          >
            {t.cancel}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 text-white px-3 py-1.5 text-sm rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? t.busy : t.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
