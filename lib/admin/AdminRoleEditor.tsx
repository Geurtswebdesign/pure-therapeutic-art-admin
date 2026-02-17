"use client";

import { useState } from "react";
import { updateUserRole } from "@/app/admin/users/actions";

type UserRole = "user" | "admin";

export default function AdminRoleEditor({
  userId,
  initialRole,
}: {
  userId: string;
  initialRole: UserRole;
}) {
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
        err instanceof Error ? err.message : "Onbekende fout"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded border p-3">
      <div className="text-sm font-medium">👤 Gebruikersrol</div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {success && (
        <div className="text-sm text-green-600">
          Rol succesvol bijgewerkt
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
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>

      {role === "admin" && (
        <div className="text-xs text-orange-600">
          ⚠️ Admins hebben volledige toegang tot het systeem
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {saving ? "Opslaan…" : "Rol opslaan"}
      </button>
    </div>
  );
}
