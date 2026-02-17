"use client";

import { useState } from "react";
import { updateUserProfile } from "@/app/admin/users/actions";

type UserProfileProps = {
  user: {
    user_id: string;
    display_name: string | null;
    email: string | null;
  };
};

export default function UserProfileForm({ user }: UserProfileProps) {
  const [displayName, setDisplayName] = useState(user.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSuccess(false);

    await updateUserProfile({
      userId: user.user_id,
      displayName,
    });

    setSaving(false);
    setSuccess(true);
  }

  return (
    <div className="rounded border bg-white p-4 space-y-4">
      <h2 className="text-lg font-medium">Profiel</h2>

      <div className="space-y-1">
        <label className="text-sm font-medium">Weergavenaam</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div className="text-sm text-gray-600">
        E-mail: <strong>{user.email ?? "—"}</strong>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-[#2271b1] px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Opslaan…" : "Profiel opslaan"}
        </button>

        {success && (
          <span className="text-sm text-green-600">
            Opgeslagen
          </span>
        )}
      </div>
    </div>
  );
}
