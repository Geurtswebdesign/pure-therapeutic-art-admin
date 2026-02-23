"use client";

import { useState, useTransition } from "react";
import { updateMyProfile } from "@/app/account/actions";

type Props = {
  initialDisplayName: string;
  initialBio: string;
  email: string;
};

export default function AccountProfileForm({
  initialDisplayName,
  initialBio,
  email,
}: Props) {
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
        setMessage("Profiel opgeslagen.");
      } catch (e) {
        const text = e instanceof Error ? e.message : "Opslaan mislukt.";
        setMessage(text);
      }
    });
  }

  return (
    <section className="rounded border bg-white p-4 space-y-4">
      <h2 className="text-lg font-semibold">Profiel</h2>

      <label className="block space-y-1">
        <span className="text-sm text-gray-600">E-mail</span>
        <input
          value={email}
          disabled
          className="w-full rounded border bg-gray-100 px-3 py-2 text-sm"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-gray-600">Weergavenaam</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-gray-600">Biografie</span>
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
          {isPending ? "Opslaan..." : "Opslaan"}
        </button>

        {message ? <p className="text-sm text-gray-600">{message}</p> : null}
      </div>
    </section>
  );
}
