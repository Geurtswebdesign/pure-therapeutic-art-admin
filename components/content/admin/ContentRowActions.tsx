"use client";

import { useState } from "react";
import {
  bulkTrashContent,
  bulkRestoreContent,
  bulkDeleteContent,
} from "@/components/content/admin/actions";

type Props = {
  id: string;
  status: "draft" | "published" | "trash";
  onQuickEdit?: () => void;
};

export default function ContentRowActions({
  id,
  status,
  onQuickEdit,
}: Props) {
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
    if (!confirm("Weet je zeker dat je dit item permanent wilt verwijderen?")) {
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
            Bewerken
          </a>

          {onQuickEdit && (
            <button
              type="button"
              onClick={onQuickEdit}
              className="hover:underline"
            >
              Snel bewerken
            </button>
          )}

          <button
            onClick={moveToTrash}
            disabled={loading}
            className="hover:underline"
          >
            Prullenbak
          </button>

          <a
            href={`/content/${id}`}
            target="_blank"
            className="hover:underline"
          >
            Bekijken
          </a>
        </>
      ) : (
        <>
          <button
            onClick={restore}
            disabled={loading}
            className="text-blue-600 hover:underline"
          >
            Herstellen
          </button>

          <button
            onClick={deletePermanent}
            disabled={loading}
            className="text-red-600 hover:underline"
          >
            Permanent verwijderen
          </button>
        </>
      )}
    </div>
  );
}
