"use client";

import { useState, useTransition } from "react";
import { saveGeneralSettings } from "@/lib/settings/actions";
import type { GeneralSettings } from "@/lib/settings/types";
import { LANGUAGE_OPTIONS } from "@/lib/i18n/languages";

type Props = {
  initialValues: GeneralSettings;
};

export default function GeneralSettingsForm({ initialValues }: Props) {
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

  function toggleLanguage(code: string) {
    setForm((prev) => {
      const exists = prev.enabledLanguages.includes(code);
      const nextEnabled = exists
        ? prev.enabledLanguages.filter((item) => item !== code)
        : [...prev.enabledLanguages, code];

      // Primary language must always stay enabled.
      if (!nextEnabled.includes(prev.primaryLanguage)) {
        nextEnabled.unshift(prev.primaryLanguage);
      }

      return { ...prev, enabledLanguages: nextEnabled };
    });
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
        setError(err instanceof Error ? err.message : "Opslaan mislukt.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Sitenaam</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.siteName}
          onChange={(e) => handleChange("siteName", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Tagline</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.tagline}
          onChange={(e) => handleChange("tagline", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Tijdzone</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.timezone}
          onChange={(e) => handleChange("timezone", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Landinstelling</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.locale}
          onChange={(e) => handleChange("locale", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Valuta</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.currency}
          onChange={(e) => handleChange("currency", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Primaire taal</label>
        <select
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.primaryLanguage}
          onChange={(e) => {
            const nextPrimary = e.target.value;
            setForm((prev) => ({
              ...prev,
              primaryLanguage: nextPrimary,
              enabledLanguages: prev.enabledLanguages.includes(nextPrimary)
                ? prev.enabledLanguages
                : [nextPrimary, ...prev.enabledLanguages],
            }));
          }}
        >
          {LANGUAGE_OPTIONS.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Ingeschakelde talen</label>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded border p-3 text-sm">
          {LANGUAGE_OPTIONS.map((lang) => (
            <label key={lang.code} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.enabledLanguages.includes(lang.code)}
                onChange={() => toggleLanguage(lang.code)}
              />
              <span>{lang.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {isPending ? "Opslaan..." : "Instellingen opslaan"}
        </button>

        {success ? (
          <span className="text-sm text-green-600">
            Instellingen succesvol opgeslagen
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
