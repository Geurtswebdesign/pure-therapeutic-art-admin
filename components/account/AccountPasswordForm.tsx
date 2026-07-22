"use client";

import { useState, useTransition } from "react";
import { updateMyPassword } from "@/app/account/actions";
import type { UiLanguage } from "@/lib/i18n/runtime";

const COPY = {
  nl: {
    title: "Wachtwoord wijzigen",
    intro: "Bevestig je huidige wachtwoord en kies daarna een nieuw wachtwoord.",
    current: "Huidig wachtwoord",
    next: "Nieuw wachtwoord",
    confirm: "Herhaal nieuw wachtwoord",
    mismatch: "De nieuwe wachtwoorden komen niet overeen.",
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
    success: "Your password has been changed.",
    submit: "Change password",
    busy: "Changing...",
  },
  de: {
    title: "Passwort andern",
    intro: "Bestatige dein aktuelles Passwort und wahle danach ein neues Passwort.",
    current: "Aktuelles Passwort",
    next: "Neues Passwort",
    confirm: "Neues Passwort wiederholen",
    mismatch: "Die neuen Passworter stimmen nicht uberein.",
    success: "Dein Passwort wurde geandert.",
    submit: "Passwort andern",
    busy: "Wird geandert...",
  },
} as const;

export default function AccountPasswordForm({ language }: { language: UiLanguage }) {
  const t = COPY[language];
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
        await updateMyPassword({ currentPassword, newPassword });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setMessage(t.success);
      } catch (error) {
        setIsError(true);
        setMessage(error instanceof Error ? error.message : t.mismatch);
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
