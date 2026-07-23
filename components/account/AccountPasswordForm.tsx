"use client";

import { useState, useTransition } from "react";
import {
  resolveBaseUiLanguage,
  type UiLanguage,
} from "@/lib/i18n/runtime";

const COPY = {
  nl: {
    title: "Wachtwoord wijzigen",
    intro: "Bevestig je huidige wachtwoord en kies daarna een nieuw wachtwoord.",
    current: "Huidig wachtwoord",
    next: "Nieuw wachtwoord",
    confirm: "Herhaal nieuw wachtwoord",
    mismatch: "De nieuwe wachtwoorden komen niet overeen.",
    currentRequired: "Vul je huidige wachtwoord in.",
    tooShort: "Het nieuwe wachtwoord moet minimaal 8 tekens bevatten.",
    mustDiffer: "Kies een ander wachtwoord dan je huidige wachtwoord.",
    currentIncorrect: "Het huidige wachtwoord is niet correct.",
    notAuthenticated: "Je bent niet meer ingelogd. Log opnieuw in.",
    failed: "Wachtwoord wijzigen is mislukt. Probeer het opnieuw.",
    mfaPrompt: "Vul ter bevestiging de code uit je authenticator-app in.",
    mfaCode: "2FA-code",
    mfaInvalid: "De 2FA-code is ongeldig. Probeer het opnieuw.",
    mfaUnavailable: "2FA kan niet worden gecontroleerd. Log opnieuw in.",
    policyRejected:
      "Dit wachtwoord voldoet niet aan het ingestelde wachtwoordbeleid. Gebruik hoofdletters, kleine letters, cijfers en een speciaal teken.",
    serviceUnauthorized:
      "De server kan het wachtwoord momenteel niet aanpassen. Controleer de Supabase-serviceconfiguratie.",
    success: "Je wachtwoord is gewijzigd.",
    submit: "Wachtwoord wijzigen",
    busy: "Wijzigen...",
  },
  en: {
    title: "Change password",
    intro: "Confirm your current password, then choose a new password.",
    current: "Current password",
    next: "New password",
    confirm: "Repeat new password",
    mismatch: "The new passwords do not match.",
    currentRequired: "Enter your current password.",
    tooShort: "The new password must contain at least 8 characters.",
    mustDiffer: "Choose a password that differs from your current password.",
    currentIncorrect: "The current password is incorrect.",
    notAuthenticated: "You are no longer signed in. Please sign in again.",
    failed: "Changing the password failed. Please try again.",
    mfaPrompt: "Enter the code from your authenticator app to confirm.",
    mfaCode: "2FA code",
    mfaInvalid: "The 2FA code is invalid. Please try again.",
    mfaUnavailable: "2FA could not be verified. Please sign in again.",
    policyRejected:
      "This password does not meet the password policy. Use uppercase and lowercase letters, numbers, and a special character.",
    serviceUnauthorized:
      "The server cannot change the password right now. Check the Supabase service configuration.",
    success: "Your password has been changed.",
    submit: "Change password",
    busy: "Changing...",
  },
  de: {
    title: "Passwort ändern",
    intro: "Bestätige dein aktuelles Passwort und wähle danach ein neues Passwort.",
    current: "Aktuelles Passwort",
    next: "Neues Passwort",
    confirm: "Neues Passwort wiederholen",
    mismatch: "Die neuen Passwörter stimmen nicht überein.",
    currentRequired: "Gib dein aktuelles Passwort ein.",
    tooShort: "Das neue Passwort muss mindestens 8 Zeichen enthalten.",
    mustDiffer: "Wähle ein anderes Passwort als dein aktuelles Passwort.",
    currentIncorrect: "Das aktuelle Passwort ist nicht korrekt.",
    notAuthenticated: "Du bist nicht mehr angemeldet. Bitte melde dich erneut an.",
    failed: "Das Passwort konnte nicht geändert werden. Versuche es erneut.",
    mfaPrompt: "Gib zur Bestätigung den Code aus deiner Authenticator-App ein.",
    mfaCode: "2FA-Code",
    mfaInvalid: "Der 2FA-Code ist ungültig. Versuche es erneut.",
    mfaUnavailable: "2FA konnte nicht überprüft werden. Bitte melde dich erneut an.",
    policyRejected:
      "Dieses Passwort erfüllt die Passwortrichtlinie nicht. Verwende Groß- und Kleinbuchstaben, Zahlen und ein Sonderzeichen.",
    serviceUnauthorized:
      "Der Server kann das Passwort derzeit nicht ändern. Prüfe die Supabase-Servicekonfiguration.",
    success: "Dein Passwort wurde geändert.",
    submit: "Passwort ändern",
    busy: "Wird geändert...",
  },
} as const;

export default function AccountPasswordForm({ language }: { language: UiLanguage }) {
  const t = COPY[resolveBaseUiLanguage(language)];
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsError(false);

    if (newPassword !== confirmPassword) {
      setMessage(t.mismatch);
      setIsError(true);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/account/password", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword, mfaCode }),
        });
        const result = (await response.json()) as
          | { ok: true }
          | { ok: false; code: string };
        const translatedErrors: Record<string, string> = {
          PASSWORD_NOT_AUTHENTICATED: t.notAuthenticated,
          PASSWORD_CURRENT_REQUIRED: t.currentRequired,
          PASSWORD_TOO_SHORT: t.tooShort,
          PASSWORD_MUST_DIFFER: t.mustDiffer,
          PASSWORD_CURRENT_INCORRECT: t.currentIncorrect,
          PASSWORD_UPDATE_FAILED: t.failed,
          PASSWORD_MFA_INVALID: t.mfaInvalid,
          PASSWORD_MFA_UNAVAILABLE: t.mfaUnavailable,
          PASSWORD_MFA_FAILED: t.mfaUnavailable,
          PASSWORD_POLICY_REJECTED: t.policyRejected,
          PASSWORD_SERVICE_UNAUTHORIZED: t.serviceUnauthorized,
        };

        if (!result.ok && result.code === "PASSWORD_MFA_REQUIRED") {
          setIsError(false);
          setRequiresMfa(true);
          setMessage(t.mfaPrompt);
          return;
        }

        if (!result.ok) {
          setIsError(true);
          setMessage(translatedErrors[result.code] ?? t.failed);
          return;
        }

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setMfaCode("");
        setRequiresMfa(false);
        setMessage(t.success);
      } catch {
        setIsError(true);
        setMessage(t.failed);
      }
    });
  }

  const inputClass =
    "w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900";

  return (
    <section className="space-y-4 rounded-2xl border border-[#e5dbcf] bg-[#f7f0e9] p-4">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">{t.title}</h2>
        <p className="mt-1 text-sm text-stone-600">{t.intro}</p>
      </div>
      <form className="space-y-4" onSubmit={submit}>
        <label className="block space-y-1">
          <span className="text-sm text-stone-600">{t.current}</span>
          <input className={inputClass} type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm text-stone-600">{t.next}</span>
            <input className={inputClass} type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm text-stone-600">{t.confirm}</span>
            <input className={inputClass} type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </label>
        </div>
        {requiresMfa ? (
          <label className="block space-y-1">
            <span className="text-sm text-stone-600">{t.mfaCode}</span>
            <input
              className={inputClass}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={mfaCode}
              onChange={(event) => setMfaCode(event.target.value)}
            />
          </label>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={isPending} className="rounded-full bg-[#1c2428] px-4 py-2 text-sm text-white disabled:opacity-60">
            {isPending ? t.busy : t.submit}
          </button>
          {message ? <p role="status" className={`text-sm ${isError ? "text-red-700" : "text-green-700"}`}>{message}</p> : null}
        </div>
      </form>
    </section>
  );
}
