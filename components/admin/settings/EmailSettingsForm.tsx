"use client";

import { useState, useTransition } from "react";
import {
  saveEmailSettings,
  sendEmailSettingsTest,
} from "@/lib/settings/email-actions";
import type { EmailSettings } from "@/lib/settings/email-types";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Props = {
  initialValues: EmailSettings;
  language: UiLanguage;
};

type Copy = {
  googleConfig: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  gmailUser: string;
  googleClientId: string;
  googleClientSecret: string;
  clientSecretHint: string;
  googleRefreshToken: string;
  refreshTokenHint: string;
  save: string;
  saving: string;
  saved: string;
  saveFailed: string;
  testMail: string;
  testRecipient: string;
  sendTest: string;
  sendingTest: string;
  testSent: string;
  testFailed: string;
  googleHelp: string;
};

function getCopy(language: UiLanguage): Copy {
  if (language === "en") {
    return {
      googleConfig: "Google Workspace SMTP (OAuth2)",
      fromName: "From name",
      fromEmail: "From email",
      replyTo: "Reply-to",
      gmailUser: "Gmail address",
      googleClientId: "Google Client ID",
      googleClientSecret: "Google Client Secret",
      clientSecretHint: "Leave empty to keep the current secret.",
      googleRefreshToken: "Google Refresh Token",
      refreshTokenHint: "Leave empty to keep the current token.",
      save: "Save settings",
      saving: "Saving...",
      saved: "Settings saved.",
      saveFailed: "Saving failed.",
      testMail: "Send test email",
      testRecipient: "Test recipient",
      sendTest: "Send test",
      sendingTest: "Sending...",
      testSent: "Test email sent successfully.",
      testFailed: "Sending test email failed.",
      googleHelp:
        "Use Google Workspace OAuth2: Client ID + Client Secret + Refresh Token for the selected Gmail account.",
    };
  }

  if (language === "de") {
    return {
      googleConfig: "Google Workspace SMTP (OAuth2)",
      fromName: "Absendername",
      fromEmail: "Absender-E-Mail",
      replyTo: "Antwortadresse",
      gmailUser: "Gmail-Adresse",
      googleClientId: "Google Client ID",
      googleClientSecret: "Google Client Secret",
      clientSecretHint: "Leer lassen, um das aktuelle Secret zu behalten.",
      googleRefreshToken: "Google Refresh Token",
      refreshTokenHint: "Leer lassen, um den aktuellen Token zu behalten.",
      save: "Einstellungen speichern",
      saving: "Speichern...",
      saved: "Einstellungen gespeichert.",
      saveFailed: "Speichern fehlgeschlagen.",
      testMail: "Test-E-Mail senden",
      testRecipient: "Test-Empfanger",
      sendTest: "Test senden",
      sendingTest: "Senden...",
      testSent: "Test-E-Mail erfolgreich gesendet.",
      testFailed: "Test-E-Mail konnte nicht gesendet werden.",
      googleHelp:
        "Verwende Google Workspace OAuth2: Client ID + Client Secret + Refresh Token fur das gewahlte Gmail-Konto.",
    };
  }

  return {
    googleConfig: "Google Workspace SMTP (OAuth2)",
    fromName: "Afzendernaam",
    fromEmail: "Afzender e-mail",
    replyTo: "Antwoordadres",
    gmailUser: "Gmail-adres",
    googleClientId: "Google Client ID",
    googleClientSecret: "Google Client Secret",
    clientSecretHint: "Laat leeg om het huidige secret te behouden.",
    googleRefreshToken: "Google Refresh Token",
    refreshTokenHint: "Laat leeg om het huidige token te behouden.",
    save: "Instellingen opslaan",
    saving: "Opslaan...",
    saved: "Instellingen opgeslagen.",
    saveFailed: "Opslaan mislukt.",
    testMail: "Testmail versturen",
    testRecipient: "Test ontvanger",
    sendTest: "Test versturen",
    sendingTest: "Versturen...",
    testSent: "Testmail succesvol verzonden.",
    testFailed: "Testmail versturen mislukt.",
    googleHelp:
      "Gebruik Google Workspace OAuth2: Client ID + Client Secret + Refresh Token voor het gekozen Gmail-account.",
  };
}

export default function EmailSettingsForm({ initialValues, language }: Props) {
  const copy = getCopy(language);
  const [form, setForm] = useState<EmailSettings>(initialValues);
  const [testRecipient, setTestRecipient] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isTesting, startTesting] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  function setField<K extends keyof EmailSettings>(
    key: K,
    value: EmailSettings[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSuccess(null);
    setError(null);

    startTransition(async () => {
      try {
        await saveEmailSettings(form);
        setForm((prev) => ({
          ...prev,
          googleClientSecret: "",
          googleRefreshToken: "",
          hasClientSecret: true,
          hasRefreshToken: true,
        }));
        setSuccess(copy.saved);
      } catch (err) {
        setError(err instanceof Error ? err.message : copy.saveFailed);
      }
    });
  }

  function handleSendTest(event: React.FormEvent) {
    event.preventDefault();
    setTestStatus(null);
    setTestError(null);

    startTesting(async () => {
      try {
        await sendEmailSettingsTest(testRecipient);
        setTestStatus(copy.testSent);
      } catch (err) {
        setTestError(err instanceof Error ? err.message : copy.testFailed);
      }
    });
  }

  return (
    <div className="space-y-5 rounded border bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold">{copy.googleConfig}</h2>
        <p className="mt-1 text-sm text-gray-600">{copy.googleHelp}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm text-gray-700">{copy.fromName}</span>
          <input
            value={form.fromName}
            onChange={(e) => setField("fromName", e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-gray-700">{copy.fromEmail}</span>
          <input
            type="email"
            value={form.fromEmail}
            onChange={(e) => setField("fromEmail", e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-gray-700">{copy.replyTo}</span>
          <input
            type="email"
            value={form.replyTo}
            onChange={(e) => setField("replyTo", e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-gray-700">{copy.gmailUser}</span>
          <input
            type="email"
            value={form.gmailUser}
            onChange={(e) => setField("gmailUser", e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
            required
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-gray-700">{copy.googleClientId}</span>
          <input
            value={form.googleClientId}
            onChange={(e) => setField("googleClientId", e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
            required
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-gray-700">
            {copy.googleClientSecret}
            {form.hasClientSecret ? " (••••••••)" : ""}
          </span>
          <input
            type="password"
            value={form.googleClientSecret}
            onChange={(e) => setField("googleClientSecret", e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder={copy.clientSecretHint}
          />
          <span className="text-xs text-gray-500">{copy.clientSecretHint}</span>
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-gray-700">
            {copy.googleRefreshToken}
            {form.hasRefreshToken ? " (••••••••)" : ""}
          </span>
          <textarea
            value={form.googleRefreshToken}
            onChange={(e) => setField("googleRefreshToken", e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
            rows={3}
            placeholder={copy.refreshTokenHint}
          />
          <span className="text-xs text-gray-500">{copy.refreshTokenHint}</span>
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {isPending ? copy.saving : copy.save}
          </button>

          {success ? <span className="text-sm text-green-700">{success}</span> : null}
          {error ? <span className="text-sm text-red-700">{error}</span> : null}
        </div>
      </form>

      <hr />

      <form onSubmit={handleSendTest} className="space-y-3">
        <h3 className="text-sm font-semibold">{copy.testMail}</h3>
        <label className="block space-y-1">
          <span className="text-sm text-gray-700">{copy.testRecipient}</span>
          <input
            type="email"
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
            required
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isTesting}
            className="rounded border px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-60"
          >
            {isTesting ? copy.sendingTest : copy.sendTest}
          </button>
          {testStatus ? <span className="text-sm text-green-700">{testStatus}</span> : null}
          {testError ? <span className="text-sm text-red-700">{testError}</span> : null}
        </div>
      </form>
    </div>
  );
}
