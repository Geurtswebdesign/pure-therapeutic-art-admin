"use client";

import { useState, useTransition } from "react";
import { saveSecuritySettings } from "@/lib/settings/security-actions";
import type { SecuritySettings } from "@/lib/settings/security-types";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Props = {
  initialValues: SecuritySettings;
  language: UiLanguage;
};

export default function SecuritySettingsForm({ initialValues, language }: Props) {
  const t =
    language === "en"
      ? {
          loginAttemptLimit: "Login attempts limit",
          ipAttemptLimit: "IP attempts limit",
          loginWindowMinutes: "Login window (minutes)",
          escalationThreshold: "Escalation threshold",
          escalationWindowMinutes: "Escalation window (minutes)",
          adminSessionTimeoutMinutes: "Admin session timeout (minutes)",
          maintenanceMode: "Maintenance mode",
          maintenanceHint: "Block non-admin pages while enabled.",
          save: "Save security settings",
          saving: "Saving...",
          success: "Security settings saved.",
          failed: "Saving failed.",
        }
      : language === "de"
        ? {
            loginAttemptLimit: "Limit fur Login-Versuche",
            ipAttemptLimit: "IP-Limit fur Login-Versuche",
            loginWindowMinutes: "Login-Fenster (Minuten)",
            escalationThreshold: "Eskalationsschwelle",
            escalationWindowMinutes: "Eskalationsfenster (Minuten)",
            adminSessionTimeoutMinutes: "Admin-Sitzungs-Timeout (Minuten)",
            maintenanceMode: "Wartungsmodus",
            maintenanceHint: "Sperrt Nicht-Admin-Seiten wenn aktiv.",
            save: "Sicherheitseinstellungen speichern",
            saving: "Speichern...",
            success: "Sicherheitseinstellungen gespeichert.",
            failed: "Speichern fehlgeschlagen.",
          }
        : {
            loginAttemptLimit: "Limiet loginpogingen",
            ipAttemptLimit: "Limiet pogingen per IP",
            loginWindowMinutes: "Loginvenster (minuten)",
            escalationThreshold: "Escalatie-drempel",
            escalationWindowMinutes: "Escalatievenster (minuten)",
            adminSessionTimeoutMinutes: "Admin sessie-timeout (minuten)",
            maintenanceMode: "Onderhoudsmodus",
            maintenanceHint: "Blokkeert niet-admin pagina's zolang dit aan staat.",
            save: "Beveiligingsinstellingen opslaan",
            saving: "Opslaan...",
            success: "Beveiligingsinstellingen opgeslagen.",
            failed: "Opslaan mislukt.",
          };

  const [form, setForm] = useState<SecuritySettings>(initialValues);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setNumber<K extends keyof SecuritySettings>(key: K, value: string) {
    const parsed = Math.max(1, Number.parseInt(value || "1", 10));
    setForm((prev) => ({ ...prev, [key]: parsed as SecuritySettings[K] }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSuccess(false);
    setError(null);

    startTransition(async () => {
      try {
        await saveSecuritySettings(form);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.failed);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">{t.loginAttemptLimit}</label>
        <input
          type="number"
          min={1}
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.loginAttemptLimit}
          onChange={(e) => setNumber("loginAttemptLimit", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">{t.ipAttemptLimit}</label>
        <input
          type="number"
          min={1}
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.ipAttemptLimit}
          onChange={(e) => setNumber("ipAttemptLimit", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">{t.loginWindowMinutes}</label>
        <input
          type="number"
          min={1}
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.loginWindowMinutes}
          onChange={(e) => setNumber("loginWindowMinutes", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">{t.escalationThreshold}</label>
        <input
          type="number"
          min={1}
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.escalationThreshold}
          onChange={(e) => setNumber("escalationThreshold", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">{t.escalationWindowMinutes}</label>
        <input
          type="number"
          min={1}
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.escalationWindowMinutes}
          onChange={(e) => setNumber("escalationWindowMinutes", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">{t.adminSessionTimeoutMinutes}</label>
        <input
          type="number"
          min={1}
          className="w-full rounded border px-3 py-2 text-sm"
          value={form.adminSessionTimeoutMinutes}
          onChange={(e) => setNumber("adminSessionTimeoutMinutes", e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.maintenanceMode}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
          }
        />
        <span>{t.maintenanceMode}</span>
      </label>
      <p className="text-xs text-gray-500">{t.maintenanceHint}</p>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {isPending ? t.saving : t.save}
        </button>

        {success ? <span className="text-sm text-green-600">{t.success}</span> : null}
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
      </div>
    </form>
  );
}
