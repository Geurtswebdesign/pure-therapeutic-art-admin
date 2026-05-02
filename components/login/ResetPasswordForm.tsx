"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { AuthInput, FormField } from "@/components/login/AuthFrame";
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";
import { supabaseBrowser } from "@/lib/supabase/browser";

type ResetPasswordViewState = "loading" | "ready" | "invalid" | "success";

export default function ResetPasswordForm({
  language,
  loginHref,
}: {
  language: UiLanguage;
  loginHref: string;
}) {
  const t = getAppMessages(language).login;
  const [viewState, setViewState] =
    useState<ResetPasswordViewState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const resolveRecoverySession = async () => {
      const url = new URL(window.location.href);
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");
      const code = url.searchParams.get("code");
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (tokenHash && type === "recovery") {
        const { error: verifyError } = await supabaseBrowser.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        });

        if (!active) return;

        if (verifyError) {
          setError(verifyError.message);
          setViewState("invalid");
          return;
        }

        url.searchParams.delete("token_hash");
        url.searchParams.delete("type");
        window.history.replaceState(null, "", `${url.pathname}${url.search}`);
      } else if (code) {
        const { error: exchangeError } =
          await supabaseBrowser.auth.exchangeCodeForSession(code);

        if (!active) return;

        if (exchangeError) {
          setError(exchangeError.message);
          setViewState("invalid");
          return;
        }

        url.searchParams.delete("code");
        window.history.replaceState(null, "", `${url.pathname}${url.search}`);
      } else if (accessToken && refreshToken) {
        const { error: tokenError } = await supabaseBrowser.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!active) return;

        if (tokenError) {
          setError(tokenError.message);
          setViewState("invalid");
          return;
        }

        window.history.replaceState(null, "", url.pathname);
      }

      const { data, error: sessionError } =
        await supabaseBrowser.auth.getSession();

      if (!active) return;

      if (sessionError) {
        setError(sessionError.message);
        setViewState("invalid");
        return;
      }

      setViewState(data.session ? "ready" : "invalid");
    };

    void resolveRecoverySession();

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        setError(null);
        setViewState("ready");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError(t.resetMismatch);
      return;
    }

    setSaving(true);
    setError(null);

    const { error: updateError } = await supabaseBrowser.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setViewState("success");
    setSaving(false);

    try {
      await supabaseBrowser.auth.signOut();
    } catch {
      // Success state is enough even if local sign-out fails.
    }
  }

  if (viewState === "loading") {
    return (
      <div className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 text-sm text-[#6b5d50] shadow-sm">
        {t.resetLoading}
      </div>
    );
  }

  if (viewState === "invalid") {
    return (
      <div className="space-y-4 rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 shadow-sm">
        <p className="rounded-[1rem] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error ?? t.resetInvalid}
        </p>
        <Link
          href={loginHref}
          className="inline-flex text-sm font-medium text-[#8a5f49] underline-offset-4 hover:underline"
        >
          {t.backToLogin}
        </Link>
      </div>
    );
  }

  if (viewState === "success") {
    return (
      <div className="space-y-4 rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 shadow-sm">
        <p className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t.resetSuccess}
        </p>
        <Link
          href={loginHref}
          className="inline-flex text-sm font-medium text-[#8a5f49] underline-offset-4 hover:underline"
        >
          {t.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 shadow-sm"
    >
      <FormField label={t.password}>
        <AuthInput
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </FormField>

      <FormField label={t.confirmPassword}>
        <AuthInput
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </FormField>

      {error ? (
        <p className="rounded-[1rem] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving || password.length < 8 || confirmPassword.length < 8}
        className="w-full rounded-full bg-[#1d2327] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#2b3439] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? t.resetSubmitBusy : t.resetSubmit}
      </button>
    </form>
  );
}
