"use client";

import { useState, useTransition } from "react";
import { saveGeneralSettings } from "@/lib/settings/actions";
import type { GeneralSettings } from "@/lib/settings/types";
import { LANGUAGE_OPTIONS } from "@/lib/i18n/languages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

type Props = {
  initialValues: GeneralSettings;
};

export default function GeneralSettingsForm({ initialValues }: Props) {
  const language = resolveUiLanguage(initialValues.primaryLanguage);
  const t =
    language === "en"
      ? {
          siteName: "Site name",
          tagline: "Tagline",
          timezone: "Timezone",
          locale: "Locale",
          currency: "Currency",
          primaryLanguage: "Primary language",
          saving: "Saving...",
          save: "Save settings",
          success: "Settings saved successfully",
          saveError: "Saving failed.",
        }
      : language === "de"
        ? {
            siteName: "Seitenname",
            tagline: "Slogan",
            timezone: "Zeitzone",
            locale: "Locale",
            currency: "Wahrung",
            primaryLanguage: "Primarsprache",
            saving: "Speichern...",
            save: "Einstellungen speichern",
            success: "Einstellungen erfolgreich gespeichert",
            saveError: "Speichern fehlgeschlagen.",
          }
        : {
            siteName: "Sitenaam",
            tagline: "Tagline",
            timezone: "Tijdzone",
            locale: "Landinstelling",
            currency: "Valuta",
            primaryLanguage: "Primaire taal",
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

    startTransition(async () => {
      try {
        await saveGeneralSettings(form);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.saveError);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">{t.siteName}</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.siteName}
          onChange={(e) => handleChange("siteName", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">{t.tagline}</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.tagline}
          onChange={(e) => handleChange("tagline", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">{t.timezone}</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.timezone}
          onChange={(e) => handleChange("timezone", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">{t.locale}</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.locale}
          onChange={(e) => handleChange("locale", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">{t.currency}</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.currency}
          onChange={(e) => handleChange("currency", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">{t.primaryLanguage}</label>
        <select
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.primaryLanguage}
          onChange={(e) => handleChange("primaryLanguage", e.target.value)}
        >
          {LANGUAGE_OPTIONS.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-4">
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
