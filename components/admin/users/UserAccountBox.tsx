"use client";

import { useState } from "react";
import {
  updateUserRole,
  adminResetPassword,
} from "@/app/admin/users/actions";
import type { AdminUserProfile } from "@/lib/users/types";

type UserRole = "user" | "admin";

export default function UserAccountBox({
  profile,
}: {
  profile: AdminUserProfile;
}) {
  const [role, setRole] = useState<UserRole>(profile.role);
  const [password, setPassword] = useState("");

  return (
    <div className="bg-white border rounded">
      <div className="border-b px-4 py-3 font-medium">
        Accountbeheer
      </div>

      <div className="p-4 space-y-4 text-sm">
        <div>
          <label className="block font-medium mb-1">
            Rol
          </label>
          <select
            value={role}
            onChange={async (e) => {
              const next = e.target.value as UserRole;
              setRole(next);
              await updateUserRole(profile.user_id, next);
            }}
            className="w-full border rounded px-2 py-1"
          >
            <option value="user">Gebruiker</option>
            <option value="admin">Beheerder</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">
            Nieuw wachtwoord
          </label>
          <input
            type="password"
            className="w-full border rounded px-2 py-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={async () => {
              await adminResetPassword(profile.user_id, password);
              setPassword("");
            }}
            className="mt-2 text-xs text-red-600"
          >
            Wachtwoord resetten
          </button>
        </div>
      </div>
    </div>
  );
}
