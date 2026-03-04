"use client";

import { useState, useTransition } from "react";
import { saveGeneralSettings } from "@/lib/settings/actions";
import type { GeneralSettings } from "@/lib/settings/types";
import { LANGUAGE_OPTIONS } from "@/lib/i18n/languages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { supabaseBrowser } from "@/lib/supabase/browser";
import MediaPicker from "@/components/content/media/MediaPicker";
import { trackEvent } from "@/lib/analytics/track";

type Props = {
  initialValues: GeneralSettings;
};

export default function GeneralSettingsForm({ initialValues }: Props) {
  const language = resolveUiLanguage(initialValues.primaryLanguage);
  const t =
    language === "en"
      ? {
          sectionBrand: "Branding",
          sectionLocale: "Locale & region",
          siteName: "Site name",
          siteNameHint: "Shown in headers and emails.",
          tagline: "Tagline",
          taglineHint: "Short description shown under the site name.",
          logoUrl: "Logo URL",
          logoUrlHint: "Public image URL used across the site.",
          logoSelect: "Choose from media library",
          logoUpload: "Upload image",
          logoUploading: "Uploading...",
          logoUploadFailed: "Upload failed. Try again.",
          logoSelectHint: "Select or upload a logo image.",
          close: "Close",
          timezone: "Timezone",
          timezoneHint: "Example: Europe/Amsterdam",
          locale: "Locale",
          localeHint: "Example: nl-NL",
          currency: "Currency",
          currencyHint: "Example: EUR",
          primaryLanguage: "Primary language",
          primaryLanguageHint: "Controls admin interface language.",
          saving: "Saving...",
          save: "Save settings",
          success: "Settings saved successfully",
          saveError: "Saving failed.",
        }
      : language === "de"
        ? {
            sectionBrand: "Branding",
            sectionLocale: "Locale & Region",
            siteName: "Seitenname",
            siteNameHint: "Wird in Kopfzeilen und E-Mails angezeigt.",
            tagline: "Slogan",
            taglineHint: "Kurze Beschreibung unter dem Seitennamen.",
            logoUrl: "Logo-URL",
            logoUrlHint: "Offentliche Bild-URL fur das Logo.",
            logoSelect: "Aus Mediathek wahlen",
            logoUpload: "Bild hochladen",
            logoUploading: "Wird hochgeladen...",
            logoUploadFailed: "Upload fehlgeschlagen. Bitte erneut versuchen.",
            logoSelectHint: "Logo-Bild auswahlen oder hochladen.",
            close: "Schliessen",
            timezone: "Zeitzone",
            timezoneHint: "Beispiel: Europe/Amsterdam",
            locale: "Locale",
            localeHint: "Beispiel: de-DE",
            currency: "Wahrung",
            currencyHint: "Beispiel: EUR",
            primaryLanguage: "Primarsprache",
            primaryLanguageHint: "Steuert die Admin-Oberflaeche.",
            saving: "Speichern...",
            save: "Einstellungen speichern",
            success: "Einstellungen erfolgreich gespeichert",
            saveError: "Speichern fehlgeschlagen.",
          }
        : {
            sectionBrand: "Branding",
            sectionLocale: "Locale & regio",
            siteName: "Sitenaam",
            siteNameHint: "Wordt getoond in headers en e-mails.",
            tagline: "Tagline",
            taglineHint: "Korte omschrijving onder de sitenaam.",
            logoUrl: "Logo-URL",
            logoUrlHint: "Publieke afbeelding-URL voor het logo.",
            logoSelect: "Kies uit mediatheek",
            logoUpload: "Afbeelding uploaden",
            logoUploading: "Uploaden...",
            logoUploadFailed: "Upload mislukt. Probeer opnieuw.",
            logoSelectHint: "Selecteer of upload een logo-afbeelding.",
            close: "Sluiten",
            timezone: "Tijdzone",
            timezoneHint: "Voorbeeld: Europe/Amsterdam",
            locale: "Landinstelling",
            localeHint: "Voorbeeld: nl-NL",
            currency: "Valuta",
            currencyHint: "Voorbeeld: EUR",
            primaryLanguage: "Primaire taal",
            primaryLanguageHint: "Bepaalt de taal van de admin-interface.",
            saving: "Opslaan...",
            save: "Instellingen opslaan",
            success: "Instellingen succesvol opgeslagen",
            saveError: "Opslaan mislukt.",
          };

  const [form, setForm] = useState(initialValues);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function handleChange<K extends keyof GeneralSettings>(
    key: K,
    value: GeneralSettings[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSuccess(false);
    setError(null);
    trackEvent({
      eventName: "admin_general_settings_submit",
      eventCategory: "admin_settings",
    });

    startTransition(async () => {
      try {
        await saveGeneralSettings(form);
        setSuccess(true);
        trackEvent({
          eventName: "admin_general_settings_saved",
          eventCategory: "admin_settings",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t.saveError);
        trackEvent({
          eventName: "admin_general_settings_failed",
          eventCategory: "admin_settings",
        });
      }
    });
  }

  async function handleUploadLogo(file: File) {
    setUploadError(null);
    setUploading(true);
    trackEvent({
      eventName: "admin_logo_upload_started",
      eventCategory: "admin_settings",
    });

    try {
      const ext = file.name.split(".").pop() || "png";
      const fileName = `branding/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabaseBrowser.storage
        .from("media")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      await supabaseBrowser.from("media_assets").insert({
        file_path: `media/${fileName}`,
        mime_type: file.type || "application/octet-stream",
        alt_text: null,
      });

      const { data } = supabaseBrowser.storage.from("media").getPublicUrl(fileName);
      if (data?.publicUrl) {
        handleChange("logoUrl", data.publicUrl);
      }

      setPickerOpen(false);
      trackEvent({
        eventName: "admin_logo_upload_success",
        eventCategory: "admin_settings",
      });
    } catch {
      setUploadError(t.logoUploadFailed);
      trackEvent({
        eventName: "admin_logo_upload_failed",
        eventCategory: "admin_settings",
      });
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
      handleChange("logoUrl", url);
      setPickerOpen(false);
      trackEvent({
        eventName: "admin_logo_selected",
        eventCategory: "admin_settings",
        eventLabel: id,
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold">{t.sectionBrand}</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">{t.siteName}</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={form.siteName}
              onChange={(e) => handleChange("siteName", e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">{t.siteNameHint}</p>
          </div>

          <div>
            <label className="block text-sm font-medium">{t.tagline}</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={form.tagline}
              onChange={(e) => handleChange("tagline", e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">{t.taglineHint}</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium">{t.logoUrl}</label>
            <div className="mt-1 grid gap-4 lg:grid-cols-[120px_1fr]">
              <div className="flex items-center justify-center rounded border bg-gray-50 px-2 py-2">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt={t.logoUrl}
                    className="h-16 w-16 rounded object-contain"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center text-[10px] text-gray-400">
                    Logo
                  </div>
                )}
              </div>
              <div>
                <input
                  className="w-full rounded border px-3 py-2 text-sm"
                  value={form.logoUrl}
                  onChange={(e) => handleChange("logoUrl", e.target.value)}
                  placeholder="https://..."
                />
                <p className="mt-1 text-xs text-gray-500">{t.logoUrlHint}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
                  >
                    {t.logoSelect}
                  </button>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded border px-3 py-1.5 text-xs hover:bg-gray-50">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUploadLogo(file);
                        }
                      }}
                    />
                    {uploading ? t.logoUploading : t.logoUpload}
                  </label>
                </div>
              </div>
            </div>
            {uploadError ? (
              <p className="mt-2 text-xs text-red-600">{uploadError}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold">{t.sectionLocale}</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">{t.timezone}</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={form.timezone}
              onChange={(e) => handleChange("timezone", e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">{t.timezoneHint}</p>
          </div>

          <div>
            <label className="block text-sm font-medium">{t.locale}</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={form.locale}
              onChange={(e) => handleChange("locale", e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">{t.localeHint}</p>
          </div>

          <div>
            <label className="block text-sm font-medium">{t.currency}</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={form.currency}
              onChange={(e) => handleChange("currency", e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">{t.currencyHint}</p>
          </div>

          <div>
            <label className="block text-sm font-medium">{t.primaryLanguage}</label>
            <select
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={form.primaryLanguage}
              onChange={(e) => handleChange("primaryLanguage", e.target.value)}
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">{t.primaryLanguageHint}</p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {isPending ? t.saving : t.save}
        </button>

        {success ? (
          <span className="text-sm text-green-600">
            {t.success}
          </span>
        ) : null}

        {error ? (
          <span className="text-sm text-red-600">
            {error}
          </span>
        ) : null}
      </div>

      {pickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-lg bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">{t.logoSelect}</h4>
                <p className="text-xs text-gray-500">{t.logoSelectHint}</p>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="rounded border px-3 py-1 text-xs"
              >
                {t.close}
              </button>
            </div>
            <div className="mt-4 max-h-[60vh] overflow-auto">
              <MediaPicker onSelect={handleSelectMedia} />
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
