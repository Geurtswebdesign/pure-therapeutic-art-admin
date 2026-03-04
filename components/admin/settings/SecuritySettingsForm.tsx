"use client";

import { useState, useTransition } from "react";
import { saveSecuritySettings } from "@/lib/settings/security-actions";
import AdminTwoFactorCard from "@/components/admin/settings/AdminTwoFactorCard";
import type { SecuritySettings } from "@/lib/settings/security-types";
import type { UiLanguage } from "@/lib/i18n/runtime";
import { trackEvent } from "@/lib/analytics/track";

type Props = {
  initialValues: SecuritySettings;
  language: UiLanguage;
};

export default function SecuritySettingsForm({ initialValues, language }: Props) {
  const t =
    language === "en"
      ? {
          sectionLimits: "Login limits",
          sectionEscalation: "Escalation",
          sectionSession: "Admin session",
          sectionMfa: "Two-factor authentication",
          sectionMaintenance: "Maintenance",
          loginAttemptLimit: "Login attempts limit",
          loginAttemptHint:
            "Max failed attempts per account within the login window.",
          ipAttemptLimit: "IP attempts limit",
          ipAttemptHint: "Max failed attempts per IP within the login window.",
          loginWindowMinutes: "Login window (minutes)",
          loginWindowHint: "Time window used for counting failed attempts.",
          escalationThreshold: "Escalation threshold",
          escalationThresholdHint:
            "Number of failed attempts that triggers an escalation alert.",
          escalationWindowMinutes: "Escalation window (minutes)",
          escalationWindowHint: "Time window used to evaluate escalation threshold.",
          adminSessionTimeoutMinutes: "Admin session timeout (minutes)",
          adminSessionHint: "Auto-logout admins after inactivity.",
          mfaPolicy: "2FA policy",
          mfaPolicyHint:
            "Choose whether 2FA is optional or required for admins.",
          mfaOptIn: "Opt-in (admins choose)",
          mfaRequired: "Required for admins",
          maintenanceMode: "Maintenance mode",
          maintenanceHint: "Block non-admin pages while enabled.",
          save: "Save security settings",
          saving: "Saving...",
          success: "Security settings saved.",
          failed: "Saving failed.",
          minValue: "Minimum value is 1.",
        }
      : language === "de"
        ? {
            sectionLimits: "Login-Grenzwerte",
            sectionEscalation: "Eskalation",
            sectionSession: "Admin-Sitzung",
            sectionMfa: "Zwei-Faktor-Authentifizierung",
            sectionMaintenance: "Wartung",
            loginAttemptLimit: "Limit fur Login-Versuche",
            loginAttemptHint:
              "Max. Fehlversuche pro Konto im Login-Zeitfenster.",
            ipAttemptLimit: "IP-Limit fur Login-Versuche",
            ipAttemptHint: "Max. Fehlversuche pro IP im Login-Zeitfenster.",
            loginWindowMinutes: "Login-Fenster (Minuten)",
            loginWindowHint: "Zeitfenster zum Zaehlen von Fehlversuchen.",
            escalationThreshold: "Eskalationsschwelle",
            escalationThresholdHint:
              "Anzahl Fehlversuche, die eine Eskalation ausloest.",
            escalationWindowMinutes: "Eskalationsfenster (Minuten)",
            escalationWindowHint:
              "Zeitfenster fuer die Eskalationsbewertung.",
            adminSessionTimeoutMinutes: "Admin-Sitzungs-Timeout (Minuten)",
            adminSessionHint: "Admins nach Inaktivitaet automatisch abmelden.",
            mfaPolicy: "2FA-Richtlinie",
            mfaPolicyHint:
              "Waehlen, ob 2FA optional oder fuer Admins verpflichtend ist.",
            mfaOptIn: "Opt-in (Admins entscheiden)",
            mfaRequired: "Fuer Admins verpflichtend",
            maintenanceMode: "Wartungsmodus",
            maintenanceHint: "Sperrt Nicht-Admin-Seiten wenn aktiv.",
            save: "Sicherheitseinstellungen speichern",
            saving: "Speichern...",
            success: "Sicherheitseinstellungen gespeichert.",
            failed: "Speichern fehlgeschlagen.",
            minValue: "Minimalwert ist 1.",
          }
        : {
            sectionLimits: "Loginlimieten",
            sectionEscalation: "Escalatie",
            sectionSession: "Admin sessie",
            sectionMfa: "Two-factor authenticatie",
            sectionMaintenance: "Onderhoud",
            loginAttemptLimit: "Limiet loginpogingen",
            loginAttemptHint:
              "Max. mislukte pogingen per account binnen het loginvenster.",
            ipAttemptLimit: "Limiet pogingen per IP",
            ipAttemptHint:
              "Max. mislukte pogingen per IP binnen het loginvenster.",
            loginWindowMinutes: "Loginvenster (minuten)",
            loginWindowHint: "Tijdsvenster voor het tellen van pogingen.",
            escalationThreshold: "Escalatie-drempel",
            escalationThresholdHint:
              "Aantal mislukte pogingen dat een escalatie triggert.",
            escalationWindowMinutes: "Escalatievenster (minuten)",
            escalationWindowHint: "Tijdsvenster voor de escalatie-evaluatie.",
            adminSessionTimeoutMinutes: "Admin sessie-timeout (minuten)",
            adminSessionHint: "Logt admins automatisch uit bij inactiviteit.",
            mfaPolicy: "2FA-beleid",
            mfaPolicyHint:
              "Kies of 2FA optioneel is of verplicht voor admins.",
            mfaOptIn: "Opt-in (admins kiezen)",
            mfaRequired: "Verplicht voor admins",
            maintenanceMode: "Onderhoudsmodus",
            maintenanceHint: "Blokkeert niet-admin pagina's zolang dit aan staat.",
            save: "Beveiligingsinstellingen opslaan",
            saving: "Opslaan...",
            success: "Beveiligingsinstellingen opgeslagen.",
            failed: "Opslaan mislukt.",
            minValue: "Minimumwaarde is 1.",
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
    trackEvent({
      eventName: "admin_security_settings_submit",
      eventCategory: "admin_settings",
    });

    startTransition(async () => {
      try {
        await saveSecuritySettings(form);
        setSuccess(true);
        trackEvent({
          eventName: "admin_security_settings_saved",
          eventCategory: "admin_settings",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t.failed);
        trackEvent({
          eventName: "admin_security_settings_failed",
          eventCategory: "admin_settings",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold">{t.sectionLimits}</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium">
                  {t.loginAttemptLimit}
                </label>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  value={form.loginAttemptLimit}
                  onChange={(e) => setNumber("loginAttemptLimit", e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">{t.loginAttemptHint}</p>
                <p className="mt-1 text-xs text-gray-400">{t.minValue}</p>
              </div>

              <div>
                <label className="block text-sm font-medium">
                  {t.ipAttemptLimit}
                </label>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  value={form.ipAttemptLimit}
                  onChange={(e) => setNumber("ipAttemptLimit", e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">{t.ipAttemptHint}</p>
                <p className="mt-1 text-xs text-gray-400">{t.minValue}</p>
              </div>

              <div>
                <label className="block text-sm font-medium">
                  {t.loginWindowMinutes}
                </label>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  value={form.loginWindowMinutes}
                  onChange={(e) => setNumber("loginWindowMinutes", e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">{t.loginWindowHint}</p>
                <p className="mt-1 text-xs text-gray-400">{t.minValue}</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold">{t.sectionEscalation}</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">
                  {t.escalationThreshold}
                </label>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  value={form.escalationThreshold}
                  onChange={(e) => setNumber("escalationThreshold", e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t.escalationThresholdHint}
                </p>
                <p className="mt-1 text-xs text-gray-400">{t.minValue}</p>
              </div>

              <div>
                <label className="block text-sm font-medium">
                  {t.escalationWindowMinutes}
                </label>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                  value={form.escalationWindowMinutes}
                  onChange={(e) =>
                    setNumber("escalationWindowMinutes", e.target.value)
                  }
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t.escalationWindowHint}
                </p>
                <p className="mt-1 text-xs text-gray-400">{t.minValue}</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold">{t.sectionSession}</h3>
            <div className="mt-4">
              <label className="block text-sm font-medium">
                {t.adminSessionTimeoutMinutes}
              </label>
              <input
                type="number"
                min={1}
                className="mt-1 w-full max-w-sm rounded border px-3 py-2 text-sm"
                value={form.adminSessionTimeoutMinutes}
                onChange={(e) => setNumber("adminSessionTimeoutMinutes", e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">{t.adminSessionHint}</p>
              <p className="mt-1 text-xs text-gray-400">{t.minValue}</p>
            </div>
          </section>

          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold">{t.sectionMaintenance}</h3>
            <label className="mt-4 flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.maintenanceMode}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
                }
              />
              <span>
                <span className="block font-medium">{t.maintenanceMode}</span>
                <span className="block text-xs text-gray-500">
                  {t.maintenanceHint}
                </span>
              </span>
            </label>
          </section>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <section className="rounded-lg border bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold">{t.sectionMfa}</h3>
            <div className="mt-4">
              <label className="block text-sm font-medium">{t.mfaPolicy}</label>
              <select
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                value={form.mfaPolicy}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    mfaPolicy:
                      e.target.value === "required_admin"
                        ? "required_admin"
                        : "opt_in",
                  }))
                }
              >
                <option value="opt_in">{t.mfaOptIn}</option>
                <option value="required_admin">{t.mfaRequired}</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">{t.mfaPolicyHint}</p>
            </div>
            <div className="mt-4">
              <AdminTwoFactorCard language={language} />
            </div>
          </section>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
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
