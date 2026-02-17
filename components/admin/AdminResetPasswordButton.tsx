"use client";

import { useState } from "react";
import { adminResetPassword } from "@/app/admin/users/actions";

export default function AdminResetPasswordButton({
  userId,
}: {
  userId: string;
}) {
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
        err instanceof Error ? err.message : "Onbekende fout"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded border p-3">
      <div className="font-medium text-sm">🔑 Reset wachtwoord</div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {success && (
        <div className="text-sm text-green-600">
          Wachtwoord succesvol aangepast
        </div>
      )}

      <input
        type="password"
        className="w-full rounded border px-3 py-2 text-sm"
        placeholder="Nieuw wachtwoord (min. 8 tekens)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={handleReset}
        disabled={saving || password.length < 8}
        className="rounded bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {saving ? "Bezig…" : "Reset wachtwoord"}
      </button>
    </div>
  );
}
