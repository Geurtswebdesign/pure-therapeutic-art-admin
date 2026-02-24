"use client";

import { useState } from "react";
import { adminResetPassword } from "@/app/admin/users/actions";
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";

export default function AdminResetPasswordButton({
  userId,
  language,
}: {
  userId: string;
  language: UiLanguage;
}) {
  const t = getAppMessages(language).resetPassword;
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleReset() {
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await adminResetPassword(userId, password);
      setPassword("");
      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : t.unknownError
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded border p-3">
      <div className="font-medium text-sm">{t.title}</div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {success && (
        <div className="text-sm text-green-600">
          {t.updated}
        </div>
      )}

      <input
        type="password"
        className="w-full rounded border px-3 py-2 text-sm"
        placeholder={t.placeholder}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleReset}
        disabled={saving || password.length < 8}
        className="rounded bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {saving ? t.busy : t.reset}
      </button>
    </div>
  );
}
