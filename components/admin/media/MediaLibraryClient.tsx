"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/browser";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";

type MediaAsset = {
  id: string;
  file_path: string;
  alt_text: string | null;
  created_at?: string | null;
};

type Tab = "library" | "upload";

type Props = {
  initialTab?: Tab;
};

function resolvePublicUrl(filePath: string) {
  if (filePath.startsWith("http")) return filePath;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${filePath}`;
}

function toStoragePath(filePath: string) {
  if (!filePath.startsWith("http")) return filePath;
  const marker = "/storage/v1/object/public/";
  const idx = filePath.indexOf(marker);
  if (idx < 0) return filePath;
  return filePath.slice(idx + marker.length);
}

function slugifyBase(name: string) {
  const noExt = name.replace(/\.[^/.]+$/, "");
  return noExt
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

export default function MediaLibraryClient({ initialTab = "library" }: Props) {
  const language = resolveUiLanguage(
    typeof document !== "undefined" ? document.documentElement.lang : "nl"
  );
  const t = getAppMessages(language).mediaLibrary;
  const locale = language === "en" ? "en-US" : language === "de" ? "de-DE" : "nl-NL";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [altDraft, setAltDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedAsset = useMemo(
    () => assets.find((a) => a.id === selectedId) ?? null,
    [assets, selectedId]
  );

  const filteredAssets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((asset) => {
      const alt = (asset.alt_text ?? "").toLowerCase();
      const path = asset.file_path.toLowerCase();
      return alt.includes(q) || path.includes(q);
    });
  }, [assets, query]);

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    setAltDraft(selectedAsset?.alt_text ?? "");
  }, [selectedAsset]);

  async function loadAssets() {
    setLoading(true);
    const { data } = await supabase
      .from("media_assets")
      .select("id, file_path, alt_text, created_at")
      .order("created_at", { ascending: false });

    setAssets((data ?? []) as MediaAsset[]);
    setLoading(false);
  }

  async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
    if (!file.type.startsWith("image/")) return null;

    return await new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => {
        resolve(null);
        URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;
    });
  }

  async function handleUpload(files: FileList | File[] | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    try {
      const list = Array.from(files);
      let failed = 0;

      for (const file of list) {
        const ext = file.name.split(".").pop() ?? "bin";
        const base = slugifyBase(file.name) || "asset";
        const fileName = `library/${base}-${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          failed += 1;
          console.error("Media upload failed:", uploadError);
          continue;
        }

        // Write media row so the library always contains uploads.
        const dimensions = await getImageDimensions(file);
        const mimeType = file.type || "application/octet-stream";

        const { error: insertError } = await supabase
          .from("media_assets")
          .insert({
            file_path: `media/${fileName}`,
            mime_type: mimeType,
            width: dimensions?.width ?? null,
            height: dimensions?.height ?? null,
            alt_text: null,
          });

        if (insertError) {
          failed += 1;
          console.warn("media_assets insert failed:", insertError.message);
        }
      }

      await loadAssets();
      setTab("library");
      if (failed > 0) {
        setUploadError(
          t.uploadPartialFailed.replace("{count}", String(failed))
        );
      }
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  }

  async function saveAltText() {
    if (!selectedAsset) return;
    const { error } = await supabase
      .from("media_assets")
      .update({ alt_text: altDraft || null })
      .eq("id", selectedAsset.id);

    if (error) {
      alert(t.saveAltFailed);
      return;
    }

    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === selectedAsset.id
          ? { ...asset, alt_text: altDraft || null }
          : asset
      )
    );
  }

  async function deleteSelected() {
    if (!selectedAsset) return;
    if (!confirm(t.deleteConfirm)) return;

    const storagePath = toStoragePath(selectedAsset.file_path);
    const withoutBucket = storagePath.startsWith("media/")
      ? storagePath.slice("media/".length)
      : storagePath;

    await supabase.storage.from("media").remove([withoutBucket]);
    await supabase.from("media_assets").delete().eq("id", selectedAsset.id);

    setSelectedId(null);
    await loadAssets();
  }

  async function copyUrl() {
    if (!selectedAsset) return;
    await navigator.clipboard.writeText(resolvePublicUrl(selectedAsset.file_path));
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("library")}
          className={`rounded border px-3 py-1.5 text-sm ${
            tab === "library" ? "bg-black text-white" : "hover:bg-gray-100"
          }`}
        >
          {t.libraryTab}
        </button>
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`rounded border px-3 py-1.5 text-sm ${
            tab === "upload" ? "bg-black text-white" : "hover:bg-gray-100"
          }`}
        >
          {t.uploadTab}
        </button>
      </div>

      {tab === "upload" ? (
        <section className="rounded border bg-white p-4 space-y-3">
          <h2 className="font-medium">{t.uploadTitle}</h2>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded border px-3 py-1.5 text-sm hover:bg-gray-100"
            disabled={uploading}
          >
            {t.chooseFiles}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
          />
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleUpload(e.dataTransfer.files);
            }}
            className={`rounded border-2 border-dashed px-4 py-8 text-center text-sm ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 text-gray-500"
            }`}
          >
            {t.dropHint}
          </div>
          <p className="text-xs text-gray-500">
            {t.multiHint}
          </p>
          {uploadError ? (
            <p className="text-sm text-red-600">{uploadError}</p>
          ) : null}
        </section>
      ) : null}

      {tab === "library" ? (
        <div className="grid grid-cols-12 gap-4">
          <section className="col-span-8 rounded border bg-white p-4 space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="font-medium">{t.libraryTitle}</h2>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="ml-auto w-72 rounded border px-2 py-1 text-sm"
              />
            </div>

            {loading ? (
              <p className="text-sm text-gray-500">{t.loading}</p>
            ) : filteredAssets.length === 0 ? (
              <p className="text-sm text-gray-500">{t.noneFound}</p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {filteredAssets.map((asset) => {
                  const active = asset.id === selectedId;
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setSelectedId(asset.id)}
                      className={`rounded border p-1 text-left ${
                        active ? "border-blue-600 ring-2 ring-blue-200" : "hover:border-black"
                      }`}
                    >
                      <Image
                        src={resolvePublicUrl(asset.file_path)}
                        alt={asset.alt_text ?? ""}
                        width={320}
                        height={220}
                        unoptimized
                        className="h-28 w-full rounded object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="col-span-4 rounded border bg-white p-4 space-y-3">
            <h2 className="font-medium">{t.attachmentDetails}</h2>
            {!selectedAsset ? (
              <p className="text-sm text-gray-500">{t.selectToEdit}</p>
            ) : (
              <>
                <Image
                  src={resolvePublicUrl(selectedAsset.file_path)}
                  alt={selectedAsset.alt_text ?? ""}
                  width={420}
                  height={240}
                  unoptimized
                  className="h-auto w-full rounded border object-cover"
                />

                <div className="space-y-1 text-xs text-gray-600">
                  <p>
                    <span className="font-medium">{t.file}:</span> {selectedAsset.file_path}
                  </p>
                  {selectedAsset.created_at ? (
                    <p>
                      <span className="font-medium">{t.uploaded}:</span>{" "}
                      {new Date(selectedAsset.created_at).toLocaleString(locale)}
                    </p>
                  ) : null}
                </div>

                <label className="block space-y-1">
                  <span className="text-xs text-gray-600">{t.altText}</span>
                  <textarea
                    value={altDraft}
                    onChange={(e) => setAltDraft(e.target.value)}
                    rows={3}
                    className="w-full rounded border px-2 py-1 text-sm"
                  />
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveAltText}
                    className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
                  >
                    {t.save}
                  </button>
                  <button
                    type="button"
                    onClick={copyUrl}
                    className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
                  >
                    {t.copyUrl}
                  </button>
                  <button
                    type="button"
                    onClick={deleteSelected}
                    className="rounded border px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                  >
                    {t.delete}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
