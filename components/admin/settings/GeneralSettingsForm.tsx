"use client";

import { useState, useTransition } from "react";
import { saveGeneralSettings } from "@/lib/settings/actions";
import type { GeneralSettings } from "@/lib/settings/types";

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
        <label className="block text-sm font-medium">Site Name</label>
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
        <label className="block text-sm font-medium">Timezone</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.timezone}
          onChange={(e) => handleChange("timezone", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Locale</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.locale}
          onChange={(e) => handleChange("locale", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Currency</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.currency}
          onChange={(e) => handleChange("currency", e.target.value)}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save Settings"}
        </button>

        {success ? (
          <span className="text-sm text-green-600">
            Settings saved successfully
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
