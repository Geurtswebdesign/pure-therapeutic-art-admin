"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "../actions";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";
import { trackEvent } from "@/lib/analytics/track";

type UserRole = "user" | "admin";

export default function CreateUserForm({ language }: { language: UiLanguage }) {
  const t = getAdminMessages(language).createUserForm;
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
    trackEvent({
      eventName: "admin_user_create_submit",
      eventCategory: "admin_users",
      eventLabel: mode,
    });

    try {
      const res = await createUser({
        email,
        displayName,
        role,
        creditsInitial,
        sendInvite: mode === "invite",
        password: mode === "password" ? password : undefined,
      });

      trackEvent({
        eventName: "admin_user_create_success",
        eventCategory: "admin_users",
        eventLabel: role,
      });
      router.push(`/admin/users/${res.userId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.unknownError;
      setError(message);
      trackEvent({
        eventName: "admin_user_create_failed",
        eventCategory: "admin_users",
        eventLabel: message,
      });
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
        <label className="text-sm font-medium">{t.email}</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailPlaceholder}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">{t.displayName}</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t.displayNamePlaceholder}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">{t.role}</label>
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
          <option value="user">{t.user}</option>
          <option value="admin">{t.admin}</option>
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">{t.initialCredits}</label>
        <input
          className="w-full rounded border px-3 py-2"
          type="number"
          min={0}
          value={creditsInitial}
          onChange={(e) => setCreditsInitial(Number(e.target.value))}
        />
      </div>

      <div className="space-y-2 rounded border p-3">
        <div className="text-sm font-medium">{t.activation}</div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("invite")}
            className={`rounded border px-3 py-1 text-sm ${
              mode === "invite" ? "bg-gray-100" : ""
            }`}
          >
            {t.invite}
          </button>
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`rounded border px-3 py-1 text-sm ${
              mode === "password" ? "bg-gray-100" : ""
            }`}
          >
            {t.directPassword}
          </button>
        </div>

        {mode === "password" && (
          <div className="space-y-1">
            <label className="text-sm font-medium">{t.password}</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
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
        {saving ? t.adding : t.addUser}
      </button>
    </form>
  );
}
