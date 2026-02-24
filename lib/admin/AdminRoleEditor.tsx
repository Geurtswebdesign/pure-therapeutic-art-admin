"use client";

import { useState } from "react";
import { updateUserRole } from "@/app/admin/users/actions";
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";

type UserRole = "user" | "admin";

export default function AdminRoleEditor({
  userId,
  initialRole,
  language,
}: {
  userId: string;
  initialRole: UserRole;
  language: UiLanguage;
}) {
  const t = getAppMessages(language).roleEditor;
  const [role, setRole] = useState<UserRole>(initialRole);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await updateUserRole(userId, role);
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
      <div className="text-sm font-medium">{t.title}</div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {success && (
        <div className="text-sm text-green-600">
          {t.updated}
        </div>
      )}

      <select
        className="w-full rounded border px-3 py-2 text-sm"
        value={role}
        onChange={(e) => {
          const value = e.target.value;
          if (value === "user" || value === "admin") {
            setRole(value);
          }
        }}
      >
        <option value="user">{t.user}</option>
        <option value="admin">{t.admin}</option>
      </select>

      {role === "admin" && (
        <div className="text-xs text-orange-600">
          {t.adminWarning}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {saving ? t.saving : t.save}
      </button>
    </div>
  );
}
