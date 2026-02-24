"use client";

import { useState, useTransition } from "react";
import { updateMyProfile } from "@/app/account/actions";
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";

type Props = {
  initialDisplayName: string;
  initialBio: string;
  email: string;
  language: UiLanguage;
};

export default function AccountProfileForm({
  initialDisplayName,
  initialBio,
  email,
  language,
}: Props) {
  const t = getAppMessages(language).accountProfile;
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSave() {
    setMessage(null);
    startTransition(async () => {
      try {
        await updateMyProfile({
          displayName,
          bio,
        });
        setMessage(t.saved);
      } catch (e) {
        const text = e instanceof Error ? e.message : t.saveFailed;
        setMessage(text);
      }
    });
  }

  return (
    <section className="rounded border bg-white p-4 space-y-4">
      <h2 className="text-lg font-semibold">{t.title}</h2>

      <label className="block space-y-1">
        <span className="text-sm text-gray-600">{t.email}</span>
        <input
          value={email}
          disabled
          className="w-full rounded border bg-gray-100 px-3 py-2 text-sm"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-gray-600">{t.displayName}</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-gray-600">{t.bio}</span>
        <textarea
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {isPending ? t.saving : t.save}
        </button>

        {message ? <p className="text-sm text-gray-600">{message}</p> : null}
      </div>
    </section>
  );
}
