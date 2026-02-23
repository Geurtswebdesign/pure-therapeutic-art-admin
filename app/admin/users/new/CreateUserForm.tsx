"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "../actions";

type UserRole = "user" | "admin";

export default function CreateUserForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [creditsInitial, setCreditsInitial] = useState<number>(0);

  const [mode, setMode] = useState<"invite" | "password">("invite");
  const [password, setPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await createUser({
        email,
        displayName,
        role,
        creditsInitial,
        sendInvite: mode === "invite",
        password: mode === "password" ? password : undefined,
      });

      router.push(`/admin/users/${res.userId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Onbekende fout.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium">E-mail</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="naam@domein.nl"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Weergavenaam</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Danny Geurts"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Rol</label>
        <select
          className="w-full rounded border px-3 py-2"
          value={role}
          onChange={(e) => {
            const nextRole = e.target.value;
            if (nextRole === "user" || nextRole === "admin") {
              setRole(nextRole);
            }
          }}
        >
          <option value="user">Gebruiker</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Start credits</label>
        <input
          className="w-full rounded border px-3 py-2"
          type="number"
          min={0}
          value={creditsInitial}
          onChange={(e) => setCreditsInitial(Number(e.target.value))}
        />
      </div>

      <div className="space-y-2 rounded border p-3">
        <div className="text-sm font-medium">Account activatie</div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("invite")}
            className={`rounded border px-3 py-1 text-sm ${
              mode === "invite" ? "bg-gray-100" : ""
            }`}
          >
            Uitnodiging per e-mail
          </button>
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`rounded border px-3 py-1 text-sm ${
              mode === "password" ? "bg-gray-100" : ""
            }`}
          >
            Direct wachtwoord
          </button>
        </div>

        {mode === "password" && (
          <div className="space-y-1">
            <label className="text-sm font-medium">Wachtwoord</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="minimaal 8 tekens"
              type="password"
              required
              minLength={8}
            />
          </div>
        )}
      </div>

      <button
        disabled={saving}
        className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {saving ? "Toevoegen…" : "Gebruiker toevoegen"}
      </button>
    </form>
  );
}
