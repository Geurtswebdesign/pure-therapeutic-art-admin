"use client";

import { useState } from "react";
import AdminResetPasswordButton from "@/components/admin/AdminResetPasswordButton";
import AdminRoleEditor from "@/lib/admin/AdminRoleEditor";
import { updateUserProfileExtended } from "@/app/admin/users/actions";
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";

import type { AdminUserProfile } from "@/lib/users/getUserDetail";

type Props = {
  user: AdminUserProfile;
  language: UiLanguage;
};

export default function UserGeneralTab({ user, language }: Props) {
  const t = getAppMessages(language).userGeneral;
  const profileData = user.profile_data ?? {};

  const [firstName, setFirstName] = useState(
    profileData.first_name ?? ""
  );
  const [lastName, setLastName] = useState(
    profileData.last_name ?? ""
  );
  const [nickname, setNickname] = useState(
    profileData.nickname ?? ""
  );
  const [website, setWebsite] = useState(
    profileData.website ?? ""
  );
  const [bio, setBio] = useState(profileData.bio ?? "");

  const [displayName, setDisplayName] = useState(
    user.display_name ?? ""
  );

  const [saving, setSaving] = useState(false);

  const initialRole =
    user.role === "admin" ? "admin" : "user";

  async function handleSave() {
    setSaving(true);

    try {
      await updateUserProfileExtended({
        userId: user.user_id,
        display_name: displayName || null,
        profileData: {
          first_name: firstName,
          last_name: lastName,
          nickname,
          website,
          bio,
        },
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-10">

      {/* NAAM */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">{t.name}</h2>

        <div className="grid max-w-md gap-3">
          <input
            placeholder={t.firstName}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded border px-2 py-1"
          />
          <input
            placeholder={t.lastName}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="rounded border px-2 py-1"
          />
          <input
            placeholder={t.nickname}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="rounded border px-2 py-1"
          />

          <input
            placeholder={t.displayName}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded border px-2 py-1"
          />
        </div>
      </section>

      {/* CONTACT */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">
          {t.contactInfo}
        </h2>

        <input
          placeholder={t.website}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="rounded border px-2 py-1 max-w-md"
        />
      </section>

      {/* OVER JEZELF */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">
          {t.aboutYou}
        </h2>

        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="rounded border px-2 py-1 w-full max-w-xl"
          rows={4}
        />
      </section>

      {/* OPSLAAN */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {saving ? t.saving : t.saveChanges}
      </button>

      {/* ACCOUNT */}
      <section className="space-y-4 border-t pt-6">
        <h2 className="text-sm font-semibold text-gray-700">
          {t.accountSecurity}
        </h2>

        <AdminRoleEditor
          userId={user.user_id}
          initialRole={initialRole}
          language={language}
        />

        <AdminResetPasswordButton userId={user.user_id} language={language} />
      </section>
    </div>
  );
}
