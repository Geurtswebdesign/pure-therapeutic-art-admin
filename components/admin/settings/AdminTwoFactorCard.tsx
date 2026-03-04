"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Props = {
  language: UiLanguage;
};

type TotpFactor = {
  id: string;
  status?: "verified" | "unverified";
};

export default function AdminTwoFactorCard({ language }: Props) {
  const t = useMemo(() => {
    if (language === "en") {
      return {
        title: "Two-factor authentication (2FA)",
        subtitle: "Optional in development. Required for admins in production.",
        statusEnabled: "Enabled",
        statusDisabled: "Not enabled",
        enable: "Enable 2FA",
        disable: "Disable 2FA",
        setupTitle: "Set up authenticator app",
        setupStep1: "Scan the QR code in your authenticator app.",
        setupStep2: "Enter the 6-digit code to verify.",
        secretLabel: "Manual setup key",
        codeLabel: "Verification code",
        verify: "Verify",
        verifying: "Verifying...",
        saving: "Saving...",
        success: "2FA is enabled.",
        disabled: "2FA is disabled.",
        error: "Something went wrong. Try again.",
        qrAlt: "2FA QR code",
      };
    }
    if (language === "de") {
      return {
        title: "Zwei-Faktor-Authentifizierung (2FA)",
        subtitle:
          "Optional in der Entwicklung. Fuer Admins in Produktion verpflichtend.",
        statusEnabled: "Aktiviert",
        statusDisabled: "Nicht aktiviert",
        enable: "2FA aktivieren",
        disable: "2FA deaktivieren",
        setupTitle: "Authenticator-App einrichten",
        setupStep1: "QR-Code in der Authenticator-App scannen.",
        setupStep2: "6-stelligen Code eingeben und bestaetigen.",
        secretLabel: "Manueller Setup-Schluessel",
        codeLabel: "Verifizierungscode",
        verify: "Bestaetigen",
        verifying: "Bestaetigen...",
        saving: "Speichern...",
        success: "2FA ist aktiviert.",
        disabled: "2FA ist deaktiviert.",
        error: "Etwas ist schiefgelaufen. Bitte erneut versuchen.",
        qrAlt: "2FA QR-Code",
      };
    }
    return {
      title: "Two-factor authenticatie (2FA)",
      subtitle: "Optioneel in ontwikkeling. Verplicht voor admins in productie.",
      statusEnabled: "Ingeschakeld",
      statusDisabled: "Niet ingeschakeld",
      enable: "2FA inschakelen",
      disable: "2FA uitschakelen",
      setupTitle: "Authenticator app instellen",
      setupStep1: "Scan de QR-code in je authenticator app.",
      setupStep2: "Vul de 6-cijferige code in om te verifiëren.",
      secretLabel: "Handmatige sleutel",
      codeLabel: "Verificatiecode",
      verify: "Verifiëren",
      verifying: "Bezig...",
      saving: "Opslaan...",
      success: "2FA is ingeschakeld.",
      disabled: "2FA is uitgeschakeld.",
      error: "Er ging iets mis. Probeer opnieuw.",
      qrAlt: "2FA QR-code",
    };
  }, [language]);

  const [isPending, startTransition] = useTransition();
  const [totpFactor, setTotpFactor] = useState<TotpFactor | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error: listError } =
        await supabaseBrowser.auth.mfa.listFactors();
      if (!active) return;
      if (listError) {
        setError(t.error);
        return;
      }
      const existing = data?.totp?.[0] as TotpFactor | undefined;
      setTotpFactor(existing ?? null);
    };
    load();
    return () => {
      active = false;
    };
  }, [t.error]);

  function resetSetup() {
    setQrCode(null);
    setSecret(null);
    setFactorId(null);
    setChallengeId(null);
    setCode("");
  }

  function handleEnable() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const { data: enrollData, error: enrollError } =
          await supabaseBrowser.auth.mfa.enroll({ factorType: "totp" });
        if (enrollError || !enrollData?.id || !enrollData?.totp) {
          setError(t.error);
          return;
        }
        setFactorId(enrollData.id);
        setQrCode(enrollData.totp.qr_code ?? null);
        setSecret(enrollData.totp.secret ?? null);

        const { data: challengeData, error: challengeError } =
          await supabaseBrowser.auth.mfa.challenge({ factorId: enrollData.id });
        if (challengeError || !challengeData?.id) {
          setError(t.error);
          return;
        }
        setChallengeId(challengeData.id);
      } catch {
        setError(t.error);
      }
    });
  }

  function handleVerify() {
    if (!factorId || !challengeId) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const { error: verifyError } = await supabaseBrowser.auth.mfa.verify({
          factorId,
          challengeId,
          code,
        });
        if (verifyError) {
          setError(verifyError.message || t.error);
          return;
        }
        const { data } = await supabaseBrowser.auth.mfa.listFactors();
        const existing = data?.totp?.[0] as TotpFactor | undefined;
        setTotpFactor(existing ?? null);
        setSuccess(t.success);
        resetSetup();
        if (window.location.search.includes("step=mfa-setup")) {
          window.location.href = "/admin";
        }
      } catch {
        setError(t.error);
      }
    });
  }

  function handleDisable() {
    if (!totpFactor?.id) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const { error: unenrollError } = await supabaseBrowser.auth.mfa.unenroll({
          factorId: totpFactor.id,
        });
        if (unenrollError) {
          setError(unenrollError.message || t.error);
          return;
        }
        setTotpFactor(null);
        resetSetup();
        setSuccess(t.disabled);
      } catch {
        setError(t.error);
      }
    });
  }

  const enabled = totpFactor?.status === "verified";

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">{t.title}</h3>
          <p className="mt-1 text-xs text-gray-500">{t.subtitle}</p>
        </div>
        <div className="text-xs text-gray-600">
          {enabled ? t.statusEnabled : t.statusDisabled}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {enabled ? (
          <button
            type="button"
            onClick={handleDisable}
            disabled={isPending}
            className="rounded border border-gray-300 px-3 py-1.5 text-xs disabled:opacity-60"
          >
            {isPending ? t.saving : t.disable}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleEnable}
            disabled={isPending}
            className="rounded bg-black px-3 py-1.5 text-xs text-white disabled:opacity-60"
          >
            {isPending ? t.saving : t.enable}
          </button>
        )}
      </div>

      {qrCode ? (
        <div className="mt-4 grid gap-4 md:grid-cols-[160px_1fr]">
          <div className="flex items-start justify-center rounded border bg-white p-2">
            <img src={qrCode} alt={t.qrAlt} className="h-36 w-36" />
          </div>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="font-medium text-gray-900">{t.setupTitle}</div>
            <p>{t.setupStep1}</p>
            <p>{t.setupStep2}</p>
            {secret ? (
              <div className="rounded border bg-gray-50 px-3 py-2 text-xs text-gray-700">
                <span className="font-medium">{t.secretLabel}:</span> {secret}
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder={t.codeLabel}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="w-40 rounded border px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={isPending || code.length < 6}
                className="rounded bg-black px-3 py-1.5 text-xs text-white disabled:opacity-60"
              >
                {isPending ? t.verifying : t.verify}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {success ? <p className="mt-3 text-xs text-green-600">{success}</p> : null}
      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
    </section>
  );
}
