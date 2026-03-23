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
type FolderFilter = "all" | string;
type UploadItem = {
  id: string;
  name: string;
  progress: number;
  status: "queued" | "uploading" | "processing" | "done" | "failed";
  error?: string;
};

type Props = {
  initialTab?: Tab;
};

const MAX_UPLOAD_MB = Number(process.env.NEXT_PUBLIC_MEDIA_MAX_FILE_SIZE_MB ?? "100");
const MAX_UPLOAD_BYTES = Math.max(1, MAX_UPLOAD_MB) * 1024 * 1024;

function friendlyUploadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();
  if (lower.includes("maximum allowed size") || lower.includes("payload too large")) {
    return `Bestand te groot. Maximaal ${MAX_UPLOAD_MB} MB per bestand.`;
  }
  return "Upload mislukt. Controleer bestandsgrootte en probeer opnieuw.";
}

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

function sanitizeFolderPath(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\\/g, "/")
    .replace(/[^a-z0-9/_-]/g, "")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");
}

function relativePath(filePath: string) {
  const storagePath = toStoragePath(filePath);
  return storagePath.startsWith("media/")
    ? storagePath.slice("media/".length)
    : storagePath;
}

function folderPathFromAsset(filePath: string) {
  const rel = relativePath(filePath);
  const parts = rel.split("/").filter(Boolean);
  if (parts.length <= 1) return "library";
  return parts.slice(0, -1).join("/");
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
  const [folderFilter, setFolderFilter] = useState<FolderFilter>("all");
  const [uploadFolder, setUploadFolder] = useState("library");
  const [newFolderInput, setNewFolderInput] = useState("");
  const [manualFolders, setManualFolders] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkMoveFolder, setBulkMoveFolder] = useState("library");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [altDraft, setAltDraft] = useState("");
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedAsset = useMemo(
    () => assets.find((a) => a.id === selectedId) ?? null,
    [assets, selectedId]
  );
  const selectedAssets = useMemo(
    () => assets.filter((asset) => selectedIds.includes(asset.id)),
    [assets, selectedIds]
  );

  const folders = useMemo(() => {
    const set = new Set<string>(["library"]);
    for (const asset of assets) {
      set.add(folderPathFromAsset(asset.file_path));
    }
    for (const folder of manualFolders) {
      set.add(folder);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [assets, manualFolders]);

  const filteredAssets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((asset) => {
      const alt = (asset.alt_text ?? "").toLowerCase();
      const path = asset.file_path.toLowerCase();
      const matchesQuery = !q || alt.includes(q) || path.includes(q);
      const matchesFolder =
        folderFilter === "all" ||
        folderPathFromAsset(asset.file_path) === folderFilter;
      return matchesQuery && matchesFolder;
    });
  }, [assets, query, folderFilter]);

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
      const queue: UploadItem[] = list.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        progress: 0,
        status: "queued",
      }));
      setUploadItems(queue);

      const setItem = (
        id: string,
        patch: Partial<Pick<UploadItem, "progress" | "status" | "error">>
      ) => {
        setUploadItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
        );
      };

      for (let i = 0; i < list.length; i += 1) {
        const file = list[i];
        const uploadItemId = queue[i].id;
        try {
          if (file.size > MAX_UPLOAD_BYTES) {
            failed += 1;
            setUploadError(`1 of meer bestanden zijn te groot. Maximaal ${MAX_UPLOAD_MB} MB.`);
            setItem(uploadItemId, {
              status: "failed",
              progress: 100,
              error: `Bestand te groot (max ${MAX_UPLOAD_MB} MB)`,
            });
            continue;
          }

          const ext = file.name.split(".").pop() ?? "bin";
          const base = slugifyBase(file.name) || "asset";
          const safeFolder = sanitizeFolderPath(uploadFolder || "library") || "library";
          const fileName = `${safeFolder}/${base}-${crypto.randomUUID()}.${ext}`;
          setItem(uploadItemId, { status: "uploading", progress: 20 });

          const { error: uploadError } = await supabase.storage
            .from("media")
            .upload(fileName, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) {
            failed += 1;
            setUploadError(friendlyUploadError(uploadError));
            setItem(uploadItemId, {
              status: "failed",
              progress: 100,
              error: friendlyUploadError(uploadError),
            });
            console.error("Media upload failed:", uploadError);
            continue;
          }

          // Write media row so the library always contains uploads.
          setItem(uploadItemId, { status: "processing", progress: 80 });
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
            setItem(uploadItemId, {
              status: "failed",
              progress: 100,
              error: insertError.message,
            });
            console.warn("media_assets insert failed:", insertError.message);
            continue;
          }
          setItem(uploadItemId, { status: "done", progress: 100 });
        } catch (error) {
          failed += 1;
          setUploadError(friendlyUploadError(error));
          setItem(uploadItemId, {
            status: "failed",
            progress: 100,
            error: friendlyUploadError(error),
          });
          console.error("Media upload threw:", error);
          continue;
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

  function toggleSelect(assetId: string, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(assetId)) return prev;
        return [...prev, assetId];
      }
      return prev.filter((id) => id !== assetId);
    });
  }

  async function bulkDeleteSelected() {
    if (!selectedAssets.length) return;
    if (!confirm(`Weet je zeker dat je ${selectedAssets.length} bestand(en) wilt verwijderen?`)) {
      return;
    }

    setBulkBusy(true);
    setUploadError(null);
    try {
      const storagePaths = selectedAssets.map((asset) => relativePath(asset.file_path));
      const ids = selectedAssets.map((asset) => asset.id);

      const { error: storageError } = await supabase.storage.from("media").remove(storagePaths);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from("media_assets").delete().in("id", ids);
      if (dbError) throw dbError;

      setSelectedIds([]);
      if (selectedId && ids.includes(selectedId)) setSelectedId(null);
      await loadAssets();
    } catch (error) {
      setUploadError(friendlyUploadError(error));
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkMoveSelected() {
    if (!selectedAssets.length) return;
    const destination = sanitizeFolderPath(bulkMoveFolder || "library") || "library";

    setBulkBusy(true);
    setUploadError(null);
    try {
      for (const asset of selectedAssets) {
        const oldPath = relativePath(asset.file_path);
        const filename = oldPath.split("/").pop() ?? "";
        if (!filename) continue;
        const newPath = `${destination}/${filename}`;
        if (newPath === oldPath) continue;

        const { error: moveError } = await supabase.storage.from("media").move(oldPath, newPath);
        if (moveError) throw moveError;

        const { error: updateError } = await supabase
          .from("media_assets")
          .update({ file_path: `media/${newPath}` })
          .eq("id", asset.id);
        if (updateError) throw updateError;
      }

      await loadAssets();
      setSelectedIds([]);
      setFolderFilter(destination);
    } catch (error) {
      setUploadError(friendlyUploadError(error));
    } finally {
      setBulkBusy(false);
    }
  }

  function createFolder() {
    const safe = sanitizeFolderPath(newFolderInput);
    if (!safe) return;
    setManualFolders((prev) => (prev.includes(safe) ? prev : [...prev, safe]));
    setUploadFolder(safe);
    setNewFolderInput("");
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
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
            <div>
              <label className="mb-1 block text-xs text-gray-600">Uploadmap</label>
              <select
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                className="w-full rounded border px-2 py-1.5 text-sm"
              >
                {folders.map((folder) => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">Nieuwe map</label>
              <div className="flex gap-2">
                <input
                  value={newFolderInput}
                  onChange={(e) => setNewFolderInput(e.target.value)}
                  placeholder="bijv. natuur/landschap"
                  className="w-full rounded border px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={createFolder}
                  className="rounded border px-3 py-1.5 text-sm hover:bg-gray-100"
                >
                  Maak
                </button>
              </div>
            </div>
          </div>
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
            onChange={(e) => {
              handleUpload(e.target.files);
              e.currentTarget.value = "";
            }}
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
          {uploadItems.length ? (
            <div className="space-y-2 rounded border bg-gray-50 p-3">
              <div className="text-sm font-medium">
                Upload voortgang ({uploadItems.filter((item) => item.status === "done").length}/
                {uploadItems.length})
              </div>
              {uploadItems.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate">{item.name}</span>
                    <span
                      className={
                        item.status === "failed"
                          ? "text-red-600"
                          : item.status === "done"
                            ? "text-green-600"
                            : "text-gray-600"
                      }
                    >
                      {item.status === "queued"
                        ? "In wachtrij"
                        : item.status === "uploading"
                          ? "Uploaden"
                          : item.status === "processing"
                            ? "Verwerken"
                            : item.status === "done"
                              ? "Klaar"
                              : "Mislukt"}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-gray-200">
                    <div
                      className={`h-full ${
                        item.status === "failed" ? "bg-red-500" : "bg-[#b64040]"
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  {item.error ? (
                    <p className="text-[11px] text-red-600">{item.error}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "library" ? (
        <div className="grid grid-cols-12 gap-4">
          <aside className="col-span-3 rounded border bg-white p-4 space-y-2">
            <h2 className="font-medium">Mappen</h2>
            <button
              type="button"
              onClick={() => setFolderFilter("all")}
              className={`block w-full rounded px-2 py-1 text-left text-sm ${
                folderFilter === "all" ? "bg-black text-white" : "hover:bg-gray-100"
              }`}
            >
              Alle mappen ({assets.length})
            </button>
            {folders.map((folder) => {
              const count = assets.filter(
                (asset) => folderPathFromAsset(asset.file_path) === folder
              ).length;
              const depth = folder.split("/").length - 1;
              return (
                <button
                  key={folder}
                  type="button"
                  onClick={() => setFolderFilter(folder)}
                  className={`block w-full rounded px-2 py-1 text-left text-sm ${
                    folderFilter === folder ? "bg-black text-white" : "hover:bg-gray-100"
                  }`}
                  style={{ paddingLeft: `${8 + depth * 10}px` }}
                >
                  {folder} ({count})
                </button>
              );
            })}
          </aside>

          <section className="col-span-6 rounded border bg-white p-4 space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="font-medium">{t.libraryTitle}</h2>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="ml-auto w-72 rounded border px-2 py-1 text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded border bg-gray-50 px-2 py-2">
              <span className="text-xs text-gray-600">
                Geselecteerd: {selectedIds.length}
              </span>
              <select
                value={bulkMoveFolder}
                onChange={(e) => setBulkMoveFolder(e.target.value)}
                className="rounded border px-2 py-1 text-xs"
                disabled={bulkBusy || selectedIds.length === 0}
              >
                {folders.map((folder) => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={bulkMoveSelected}
                disabled={bulkBusy || selectedIds.length === 0}
                className="rounded border px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-50"
              >
                Verplaats naar map
              </button>
              <button
                type="button"
                onClick={bulkDeleteSelected}
                disabled={bulkBusy || selectedIds.length === 0}
                className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Verwijder selectie
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(filteredAssets.map((asset) => asset.id))}
                disabled={bulkBusy || filteredAssets.length === 0}
                className="rounded border px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-50"
              >
                Alles selecteren
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                disabled={bulkBusy || selectedIds.length === 0}
                className="rounded border px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-50"
              >
                Selectie wissen
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500">{t.loading}</p>
            ) : filteredAssets.length === 0 ? (
              <p className="text-sm text-gray-500">{t.noneFound}</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {filteredAssets.map((asset) => {
                  const active = asset.id === selectedId;
                  const checked = selectedIds.includes(asset.id);
                  return (
                    <div
                      key={asset.id}
                      className={`relative rounded border p-1 ${
                        active ? "border-blue-600 ring-2 ring-blue-200" : "hover:border-black"
                      }`}
                    >
                      <label className="absolute left-2 top-2 z-10 rounded bg-white/90 px-1">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => toggleSelect(asset.id, e.target.checked)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setSelectedId(asset.id)}
                        className="block w-full text-left"
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
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="col-span-3 rounded border bg-white p-4 space-y-3">
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
