"use client";

import { useState, useTransition } from "react";
import {
  saveBrandingSettings,
  saveCustomizerHeaderConfig,
  saveCustomizerSettings,
} from "@/lib/settings/actions";
import type {
  CustomizerHeaderConfig,
  CustomizerHeaderRule,
  CustomizerHeaderTargetType,
  CustomizerSettings,
  GeneralSettings,
} from "@/lib/settings/types";
import { supabaseBrowser } from "@/lib/supabase/browser";
import MediaPicker from "@/components/content/media/MediaPicker";

type Props = {
  initialValues: CustomizerSettings;
  brandingValues: Pick<GeneralSettings, "siteName" | "logoUrl">;
  headerConfig: CustomizerHeaderConfig;
};

export default function CustomizerSettingsForm({
  initialValues,
  brandingValues,
  headerConfig,
}: Props) {
  const [form, setForm] = useState(initialValues);
  const [branding, setBranding] = useState(brandingValues);
  const [headers, setHeaders] = useState(headerConfig.headers);
  const [rules, setRules] = useState(headerConfig.rules);
  const [fallbackHeaderId, setFallbackHeaderId] = useState<string | null>(
    headerConfig.fallbackHeaderId
  );
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<{
    kind: "branding" | "header";
    headerId?: string;
  }>({ kind: "branding" });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [collapsedHeaderIds, setCollapsedHeaderIds] = useState<string[]>([]);
  const routeOptions = [
    { value: "home", label: "Home" },
    { value: "trainingen", label: "Trainingen" },
    { value: "shop", label: "Shop" },
    { value: "therapeuten", label: "Therapeuten" },
    { value: "profiel", label: "Profiel" },
    ...headerConfig.categories.map((category) => ({
      value: `category:${category.slug}`,
      label: `Categorie: ${category.name}`,
    })),
  ];

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

  function setHeaderField(
    headerId: string,
    key: "name" | "logoUrl" | "logoAlt" | "subtitle" | "isActive",
    value: string | boolean
  ) {
    setHeaders((prev) =>
      prev.map((header) =>
        header.id === headerId ? { ...header, [key]: value } : header
      )
    );
  }

  function addHeader() {
    const id = crypto.randomUUID();
    setHeaders((prev) => [
      ...prev,
      {
        id,
        name: `Header ${prev.length + 1}`,
        logoUrl: "",
        logoAlt: "",
        subtitle: "",
        isActive: true,
        sortOrder: prev.length,
      },
    ]);
    if (!fallbackHeaderId) setFallbackHeaderId(id);
  }

  function removeHeader(headerId: string) {
    setHeaders((prev) => prev.filter((header) => header.id !== headerId));
    setRules((prev) => prev.filter((rule) => rule.headerId !== headerId));
    if (fallbackHeaderId === headerId) setFallbackHeaderId(null);
    setCollapsedHeaderIds((prev) => prev.filter((id) => id !== headerId));
  }

  function toggleHeaderCollapse(headerId: string) {
    setCollapsedHeaderIds((prev) =>
      prev.includes(headerId)
        ? prev.filter((id) => id !== headerId)
        : [...prev, headerId]
    );
  }

  function addRule() {
    const defaultHeaderId = headers[0]?.id ?? "";
    if (!defaultHeaderId) return;
    setRules((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        headerId: defaultHeaderId,
        targetType: "category",
        targetValue: "",
      },
    ]);
  }

  function setRuleField(
    ruleId: string,
    key: keyof CustomizerHeaderRule,
    value: string
  ) {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === ruleId ? { ...rule, [key]: value } : rule
      )
    );
  }

  function removeRule(ruleId: string) {
    setRules((prev) => prev.filter((rule) => rule.id !== ruleId));
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
          saveCustomizerHeaderConfig({
            headers,
            rules,
            fallbackHeaderId,
          }),
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
        if (pickerTarget.kind === "header" && pickerTarget.headerId) {
          setHeaderField(pickerTarget.headerId, "logoUrl", data.publicUrl);
        } else {
          setBrandingField("logoUrl", data.publicUrl);
        }
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
      if (pickerTarget.kind === "header" && pickerTarget.headerId) {
        setHeaderField(pickerTarget.headerId, "logoUrl", url);
      } else {
        setBrandingField("logoUrl", url);
      }
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
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium">Fallback Header</span>
              <select
                value={fallbackHeaderId ?? ""}
                onChange={(e) => setFallbackHeaderId(e.target.value || null)}
                className="w-full rounded border px-3 py-2 text-sm"
              >
                <option value="">Geen</option>
                {headers.map((header) => (
                  <option key={header.id} value={header.id}>
                    {header.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Wordt gebruikt als er geen specifieke header-regel matcht.
              </p>
            </label>
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

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Headers</h3>
            <button
              type="button"
              onClick={addHeader}
              className="rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
            >
              Header toevoegen
            </button>
          </div>
          {uploadError ? (
            <p className="text-xs text-red-600">{uploadError}</p>
          ) : null}
          <div className="space-y-3">
            {headers.map((header, index) => (
              <div key={header.id} className="rounded border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleHeaderCollapse(header.id)}
                      className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      {collapsedHeaderIds.includes(header.id) ? "Uitklappen" : "Inklappen"}
                    </button>
                    <div className="text-xs text-gray-500">Header #{index + 1}: {header.name || "Zonder naam"}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHeader(header.id)}
                    className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Verwijderen
                  </button>
                </div>
                {!collapsedHeaderIds.includes(header.id) ? (
                  <>
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        value={header.name}
                        onChange={(e) => setHeaderField(header.id, "name", e.target.value)}
                        placeholder="Header naam"
                        className="rounded border px-2 py-1.5 text-sm"
                      />
                      <input
                        value={header.subtitle}
                        onChange={(e) => setHeaderField(header.id, "subtitle", e.target.value)}
                        placeholder="Subtitle"
                        className="rounded border px-2 py-1.5 text-sm"
                      />
                      <input
                        value={header.logoUrl}
                        onChange={(e) => setHeaderField(header.id, "logoUrl", e.target.value)}
                        placeholder="Logo URL"
                        className="rounded border px-2 py-1.5 text-sm md:col-span-2"
                      />
                      <input
                        value={header.logoAlt}
                        onChange={(e) => setHeaderField(header.id, "logoAlt", e.target.value)}
                        placeholder="Logo alt tekst"
                        className="rounded border px-2 py-1.5 text-sm"
                      />
                      <label className="inline-flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={header.isActive}
                          onChange={(e) => setHeaderField(header.id, "isActive", e.target.checked)}
                        />
                        Actief
                      </label>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPickerTarget({ kind: "header", headerId: header.id });
                          setPickerOpen(true);
                        }}
                        className="rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
                      >
                        Kies logo uit mediatheek
                      </button>
                      <label className="inline-flex cursor-pointer items-center rounded border px-3 py-1.5 text-xs hover:bg-gray-50">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setPickerTarget({ kind: "header", headerId: header.id });
                            handleUploadLogo(file);
                          }}
                        />
                        {uploading ? "Uploaden..." : "Upload logo"}
                      </label>
                    </div>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Header toewijzing</h3>
            <button
              type="button"
              onClick={addRule}
              disabled={!headers.length}
              className="rounded border px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
            >
              Regel toevoegen
            </button>
          </div>
          <div className="space-y-2">
            {rules.map((rule) => (
              <div key={rule.id} className="grid gap-2 rounded border p-2 md:grid-cols-[140px_1fr_1fr_auto]">
                <select
                  value={rule.targetType}
                  onChange={(e) =>
                    setRuleField(
                      rule.id,
                      "targetType",
                      e.target.value as CustomizerHeaderTargetType
                    )
                  }
                  className="rounded border px-2 py-1.5 text-sm"
                >
                  <option value="category">Categorie</option>
                  <option value="route">Route</option>
                  <option value="page">Page</option>
                </select>
                {rule.targetType === "category" ? (
                  <select
                    value={rule.targetValue}
                    onChange={(e) => setRuleField(rule.id, "targetValue", e.target.value)}
                    className="rounded border px-2 py-1.5 text-sm"
                  >
                    <option value="">Selecteer categorie</option>
                    {headerConfig.categories.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    {rule.targetType === "route" ? (
                      <select
                        value={rule.targetValue}
                        onChange={(e) => setRuleField(rule.id, "targetValue", e.target.value)}
                        className="rounded border px-2 py-1.5 text-sm"
                      >
                        <option value="">Selecteer route</option>
                        {routeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={rule.targetValue}
                        onChange={(e) => setRuleField(rule.id, "targetValue", e.target.value)}
                        className="rounded border px-2 py-1.5 text-sm"
                        placeholder="bijv. content-index"
                      />
                    )}
                  </>
                )}
                <select
                  value={rule.headerId}
                  onChange={(e) => setRuleField(rule.id, "headerId", e.target.value)}
                  className="rounded border px-2 py-1.5 text-sm"
                >
                  {headers.map((header) => (
                    <option key={header.id} value={header.id}>
                      {header.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeRule(rule.id)}
                  className="rounded border px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  Verwijder
                </button>
              </div>
            ))}
          </div>
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
