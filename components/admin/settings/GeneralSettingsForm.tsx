"use client";

import { useState, useTransition } from "react";
import { saveGeneralSettings } from "@/lib/settings/actions";
import type { GeneralSettings } from "@/lib/settings/types";
import { LANGUAGE_OPTIONS } from "@/lib/i18n/languages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { trackEvent } from "@/lib/analytics/track";

type Props = {
  initialValues: GeneralSettings;
};

export default function GeneralSettingsForm({ initialValues }: Props) {
  const language = resolveUiLanguage(initialValues.primaryLanguage);
  const t =
    language === "en"
      ? {
          sectionLocale: "Locale & region",
          siteName: "Site name",
          siteNameHint: "Shown in headers and emails.",
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
            sectionLocale: "Locale & Region",
            siteName: "Seitenname",
            siteNameHint: "Wird in Kopfzeilen und E-Mails angezeigt.",
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
            sectionLocale: "Locale & regio",
            siteName: "Sitenaam",
            siteNameHint: "Wordt getoond in headers en e-mails.",
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

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

    </form>
  );
}
