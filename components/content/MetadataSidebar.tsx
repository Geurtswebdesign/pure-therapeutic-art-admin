"use client";

import { useState } from "react";
import PreviewButton from "@/app/admin/_components/PreviewButton";
import StatusSelect from "./StatusSelect";

export type ContentStatus = "draft" | "published" | "archived";

type MetadataSidebarProps = {
  item: {
    id: string;
    status: ContentStatus;
    slug: string | null;
    language: string;
  };

  draft: {
    status: ContentStatus;
  };

  dirty: boolean;
  onDraftChange: (patch: Partial<{ status: ContentStatus }>) => void;
  onSaveAll: () => Promise<void>;
  saving?: boolean;
};

export default function MetadataSidebar({
  item,
  draft,
  dirty,
  onDraftChange,
  onSaveAll,
  saving = false,
}: MetadataSidebarProps) {
  const currentStatus = draft.status;
  const isPublished = currentStatus === "published";
  const canSave = dirty && !saving;

  // UI-only
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [pendingStatus, setPendingStatus] =
    useState<ContentStatus>(currentStatus);

  return (
    <aside className="w-80 border-l bg-gray-50">
      {/* Header */}
      <div className="border-b px-6 py-4 font-semibold">
        Publiceren
      </div>

      <div className="p-6 space-y-6 text-sm">

        {/* Actieknoppen boven */}
        <div className="flex gap-3">
          {currentStatus === "draft" && (
            <button
              type="button"
              disabled={!canSave}
              onClick={onSaveAll}
              className="flex-1 rounded border px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
            >
              {saving ? "Opslaan…" : "Concept opslaan"}
            </button>
          )}

          {item.slug && currentStatus === "draft" && (
            <PreviewButton
              slug={item.slug}
              locale={item.language}
            />
          )}

          {item.slug && currentStatus === "published" && (
            <a
              href={`/${item.language}/${item.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded border px-3 py-2 text-center text-sm hover:bg-gray-100"
            >
              Bekijk live
            </a>
          )}
        </div>

        {/* Status */}
        <div className="space-y-3 border-t pt-4">
          {!isEditingStatus ? (
            <div className="flex items-center justify-between">
              <span>🔑 Status:</span>

              <div className="flex items-center gap-2">
                <span className="font-medium capitalize">
                  {currentStatus === "draft" && "Concept"}
                  {currentStatus === "published" && "Gepubliceerd"}
                  {currentStatus === "archived" && "Gearchiveerd"}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setPendingStatus(currentStatus);
                    setIsEditingStatus(true);
                  }}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Bewerken
                </button>
              </div>
            </div>
          ) : (
            <>
              <label className="block font-medium">
                Status
              </label>

              <div className="flex gap-2">
                <StatusSelect
                  value={pendingStatus}
                  onChange={setPendingStatus}
                />

                <button
                  type="button"
                  onClick={() => {
                    onDraftChange({ status: pendingStatus });
                    setIsEditingStatus(false);
                  }}
                  className="rounded border px-3 py-2 text-sm hover:bg-gray-100"
                >
                  OK
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingStatus(false)}
                className="text-blue-600 text-sm hover:underline"
              >
                Annuleren
              </button>
            </>
          )}

          {/* Zichtbaarheid */}
          <div className="flex items-center justify-between text-gray-600">
            <span>👁 Zichtbaarheid:</span>
            <span>Openbaar</span>
          </div>

          {/* Publicatie moment */}
          <div className="flex items-center justify-between text-gray-600">
            <span>🕒 Publiceren:</span>
            <span>Onmiddellijk</span>
          </div>
        </div>

        {/* Primaire actie */}
        <div className="border-t pt-4">
          <button
            type="button"
            disabled={!canSave}
            onClick={onSaveAll}
            className={`w-full rounded px-4 py-2 font-medium text-white ${
              canSave
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {saving ? "Opslaan…" : isPublished ? "Bijwerken" : "Publiceren"}
          </button>
        </div>
      </div>
    </aside>
  );
}
