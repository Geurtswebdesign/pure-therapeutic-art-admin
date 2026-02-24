"use client";

import { useState } from "react";
import {
  bulkTrashContent,
  bulkRestoreContent,
  bulkDeleteContent,
} from "@/components/content/admin/actions";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Props = {
  id: string;
  status: "draft" | "published" | "trash";
  language: UiLanguage;
  onQuickEdit?: () => void;
};

export default function ContentRowActions({
  id,
  status,
  language,
  onQuickEdit,
}: Props) {
  const t = getAdminMessages(language).contentRowActions;
  const [loading, setLoading] = useState(false);

  async function moveToTrash() {
    setLoading(true);
    try {
      await bulkTrashContent([id]);
      location.reload();
    } finally {
      setLoading(false);
    }
  }

  async function restore() {
    setLoading(true);
    try {
      await bulkRestoreContent([id]);
      location.reload();
    } finally {
      setLoading(false);
    }
  }

  async function deletePermanent() {
    if (!confirm(t.deleteConfirm)) {
      return;
    }

    setLoading(true);
    try {
      await bulkDeleteContent([id]);
      location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-1 flex gap-2 text-xs text-gray-600 opacity-0 group-hover:opacity-100">
      {status !== "trash" ? (
        <>
          <a
            href={`/admin/content/${id}`}
            className="text-blue-600 hover:underline"
          >
            {t.edit}
          </a>

          {onQuickEdit && (
            <button
              type="button"
              onClick={onQuickEdit}
              className="hover:underline"
            >
              {t.quickEdit}
            </button>
          )}

          <button
            onClick={moveToTrash}
            disabled={loading}
            className="hover:underline"
          >
            {t.trash}
          </button>

          <a
            href={`/content/${id}`}
            target="_blank"
            className="hover:underline"
          >
            {t.view}
          </a>
        </>
      ) : (
        <>
          <button
            onClick={restore}
            disabled={loading}
            className="text-blue-600 hover:underline"
          >
            {t.restore}
          </button>

          <button
            onClick={deletePermanent}
            disabled={loading}
            className="text-red-600 hover:underline"
          >
            {t.deletePermanent}
          </button>
        </>
      )}
    </div>
  );
}
