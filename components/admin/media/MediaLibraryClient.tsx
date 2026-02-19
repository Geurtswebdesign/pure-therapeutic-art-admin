"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/browser";

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
  const [tab, setTab] = useState<Tab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [altDraft, setAltDraft] = useState("");

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

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
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
          console.error("Media upload failed:", uploadError);
          continue;
        }

        // Try writing media row when no storage trigger is present.
        const { error: insertError } = await supabase
          .from("media_assets")
          .insert({
            file_path: `media/${fileName}`,
            alt_text: "",
          });

        if (insertError) {
          // Non-fatal, row may be created by DB trigger.
          console.warn("media_assets insert skipped:", insertError.message);
        }
      }

      await loadAssets();
      setTab("library");
    } finally {
      setUploading(false);
    }
  }

  async function saveAltText() {
    if (!selectedAsset) return;
    const { error } = await supabase
      .from("media_assets")
      .update({ alt_text: altDraft || null })
      .eq("id", selectedAsset.id);

    if (error) {
      alert("Alt-tekst opslaan mislukt.");
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
    if (!confirm("Weet je zeker dat je dit mediabestand wilt verwijderen?")) return;

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
          Bibliotheek
        </button>
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`rounded border px-3 py-1.5 text-sm ${
            tab === "upload" ? "bg-black text-white" : "hover:bg-gray-100"
          }`}
        >
          Nieuw bestand
        </button>
      </div>

      {tab === "upload" ? (
        <section className="rounded border bg-white p-4 space-y-3">
          <h2 className="font-medium">Bestanden uploaden</h2>
          <input
            type="file"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
          />
          <p className="text-xs text-gray-500">
            Je kunt meerdere afbeeldingen tegelijk uploaden.
          </p>
        </section>
      ) : null}

      {tab === "library" ? (
        <div className="grid grid-cols-12 gap-4">
          <section className="col-span-8 rounded border bg-white p-4 space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="font-medium">Mediabibliotheek</h2>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Zoek op bestandsnaam of alt-tekst"
                className="ml-auto w-72 rounded border px-2 py-1 text-sm"
              />
            </div>

            {loading ? (
              <p className="text-sm text-gray-500">Laden...</p>
            ) : filteredAssets.length === 0 ? (
              <p className="text-sm text-gray-500">Geen media gevonden.</p>
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
            <h2 className="font-medium">Bijlagegegevens</h2>
            {!selectedAsset ? (
              <p className="text-sm text-gray-500">Selecteer een bestand om metadata te bewerken.</p>
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
                    <span className="font-medium">Bestand:</span> {selectedAsset.file_path}
                  </p>
                  {selectedAsset.created_at ? (
                    <p>
                      <span className="font-medium">Geupload:</span>{" "}
                      {new Date(selectedAsset.created_at).toLocaleString("nl-NL")}
                    </p>
                  ) : null}
                </div>

                <label className="block space-y-1">
                  <span className="text-xs text-gray-600">Alt-tekst</span>
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
                    Opslaan
                  </button>
                  <button
                    type="button"
                    onClick={copyUrl}
                    className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
                  >
                    URL kopieren
                  </button>
                  <button
                    type="button"
                    onClick={deleteSelected}
                    className="rounded border px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                  >
                    Verwijderen
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
