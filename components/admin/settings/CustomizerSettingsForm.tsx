"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  saveBrandingSettings,
  saveCustomizerSettings,
} from "@/lib/settings/actions";
import type { CustomizerSettings, GeneralSettings } from "@/lib/settings/types";
import { supabaseBrowser } from "@/lib/supabase/browser";
import MediaPicker from "@/components/content/media/MediaPicker";

type Props = {
  initialValues: CustomizerSettings;
  brandingValues: Pick<GeneralSettings, "siteName" | "tagline" | "logoUrl">;
};

export default function CustomizerSettingsForm({ initialValues, brandingValues }: Props) {
  const [form, setForm] = useState(initialValues);
  const [branding, setBranding] = useState(brandingValues);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function setField<K extends keyof CustomizerSettings>(
    key: K,
    value: CustomizerSettings[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setBrandingField<K extends keyof typeof branding>(
    key: K,
    value: (typeof branding)[K]
  ) {
    setBranding((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSuccess(false);
    setError(null);
    startTransition(async () => {
      try {
        await Promise.all([
          saveCustomizerSettings(form),
          saveBrandingSettings(branding),
        ]);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Opslaan mislukt.");
      }
    });
  }

  async function handleUploadLogo(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const fileName = `branding/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabaseBrowser.storage
        .from("media")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      await supabaseBrowser.from("media_assets").insert({
        file_path: `media/${fileName}`,
        mime_type: file.type || "application/octet-stream",
        alt_text: null,
      });

      const { data } = supabaseBrowser.storage.from("media").getPublicUrl(fileName);
      if (data?.publicUrl) {
        setBrandingField("logoUrl", data.publicUrl);
      }
      setPickerOpen(false);
    } catch {
      setUploadError("Upload mislukt. Probeer opnieuw.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSelectMedia(ids: string[]) {
    const id = ids[0];
    if (!id) return;
    const { data } = await supabaseBrowser
      .from("media_assets")
      .select("file_path")
      .eq("id", id)
      .maybeSingle<{ file_path?: string | null }>();

    if (data?.file_path) {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${data.file_path}`;
      setBrandingField("logoUrl", url);
      setPickerOpen(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
      <section className="space-y-4 rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Customizer</h2>
        <p className="text-sm text-gray-600">
          Beheer kleurthema en basis weergave voor de app.
        </p>

        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-sm font-semibold">Branding</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium">Site naam</span>
              <input
                value={branding.siteName}
                onChange={(e) => setBrandingField("siteName", e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Tagline</span>
              <input
                value={branding.tagline}
                onChange={(e) => setBrandingField("tagline", e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </label>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Logo URL</label>
              <div className="grid gap-3 lg:grid-cols-[120px_1fr]">
                <div className="flex items-center justify-center rounded border bg-gray-50 p-2">
                  {branding.logoUrl ? (
                    <Image
                      src={branding.logoUrl}
                      alt="Logo preview"
                      width={64}
                      height={64}
                      unoptimized
                      className="h-16 w-16 rounded object-contain"
                    />
                  ) : (
                    <div className="text-xs text-gray-400">Logo</div>
                  )}
                </div>
                <div>
                  <input
                    value={branding.logoUrl}
                    onChange={(e) => setBrandingField("logoUrl", e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm"
                    placeholder="https://..."
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
                    >
                      Kies uit mediatheek
                    </button>
                    <label className="inline-flex cursor-pointer items-center rounded border px-3 py-1.5 text-xs hover:bg-gray-50">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadLogo(file);
                        }}
                      />
                      {uploading ? "Uploaden..." : "Afbeelding uploaden"}
                    </label>
                  </div>
                  {uploadError ? (
                    <p className="mt-2 text-xs text-red-600">{uploadError}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">Primaire kleur</span>
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setField("primaryColor", e.target.value)}
              className="h-10 w-full rounded border p-1"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Secundaire kleur</span>
            <input
              type="color"
              value={form.secondaryColor}
              onChange={(e) => setField("secondaryColor", e.target.value)}
              className="h-10 w-full rounded border p-1"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Gradient start</span>
            <input
              type="color"
              value={form.gradientFrom}
              onChange={(e) => setField("gradientFrom", e.target.value)}
              className="h-10 w-full rounded border p-1"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Gradient einde</span>
            <input
              type="color"
              value={form.gradientTo}
              onChange={(e) => setField("gradientTo", e.target.value)}
              className="h-10 w-full rounded border p-1"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Kaart radius (px)</span>
            <input
              type="number"
              min={0}
              max={40}
              value={form.cardRadius}
              onChange={(e) => setField("cardRadius", e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Font schaal (%)</span>
            <input
              type="number"
              min={80}
              max={130}
              value={form.fontScale}
              onChange={(e) => setField("fontScale", e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {isPending ? "Opslaan..." : "Opslaan"}
          </button>
          {success ? <p className="text-sm text-green-700">Opgeslagen.</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </section>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold">Live preview</h3>
        <div
          className="mt-3 rounded-xl p-4"
          style={{
            background: `linear-gradient(180deg, ${form.gradientFrom} 0%, ${form.gradientTo} 100%)`,
            fontSize: `${Number(form.fontScale || 100)}%`,
          }}
        >
          <div
            className="mb-3 p-3 text-white"
            style={{
              background: form.primaryColor,
              borderRadius: `${Number(form.cardRadius || 16)}px`,
            }}
          >
            Welkom terug
          </div>
          <div
            className="p-3"
            style={{
              background: "#ffffff",
              border: `1px solid ${form.secondaryColor}`,
              borderRadius: `${Number(form.cardRadius || 16)}px`,
            }}
          >
            Voorbeeld kaart
          </div>
        </div>
      </section>
      {pickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-lg bg-white p-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold">Kies logo uit mediatheek</h4>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded border px-3 py-1 text-xs"
              >
                Sluiten
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto">
              <MediaPicker onSelect={handleSelectMedia} />
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
