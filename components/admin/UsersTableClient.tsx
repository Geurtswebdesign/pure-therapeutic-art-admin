"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  bulkUpdateUserRole,
  bulkDeleteUsers,
  updateUserRole,
} from "@/app/admin/users/actions";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";
import { resolveAdminBrowserHref } from "@/lib/site/admin-client-paths";

type User = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: "user" | "admin";
  credits: number;
  created_at: string;
};

export default function UsersTableClient({
  users,
  currentAdminId,
  language,
}: {
  users: User[];
  currentAdminId: string;
  language: UiLanguage;
}) {
  const t = getAdminMessages(language).usersTable;
  const pathname = usePathname();
  const [selected, setSelected] = useState<string[]>([]);
  type UserRole = "admin" | "user";
  type RoleFilter = "all" | UserRole;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [loading, setLoading] = useState(false);
  
  type BulkAction =
  | ""
  | "make-admin"
  | "make-user"
  | "delete";

  const [bulkAction, setBulkAction] = useState<BulkAction>("");
  
  const filteredUsers = users.filter((u) => {
    const matchesRole =
        roleFilter === "all" || u.role === roleFilter;

    const q = search.toLowerCase();
    const matchesSearch =
        !q ||
        u.display_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);

    return matchesRole && matchesSearch;
    });

  function toggleAll(checked: boolean) {
    setSelected(checked ? filteredUsers.map((u) => u.id) : []);
  }

  function toggleOne(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function applyBulkAction() {
    if (selected.length === 0 || !bulkAction) return;

    // ❗ jezelf beschermen
    const safeIds = selected.filter(
        (id) => id !== currentAdminId
    );

    if (safeIds.length === 0) return;

    if (bulkAction === "delete") {
        const ok = confirm(
        t.deleteConfirm.replace("{count}", String(safeIds.length))
        );
        if (!ok) return;

        setLoading(true);
        await bulkDeleteUsers(safeIds);
        setLoading(false);
        location.reload();
        return;
    }

    if (bulkAction === "make-admin") {
        setLoading(true);
        await bulkUpdateUserRole(safeIds, "admin");
        setLoading(false);
    }

    if (bulkAction === "make-user") {
        setLoading(true);
        await bulkUpdateUserRole(safeIds, "user");
        setLoading(false);
    }

    location.reload();
    }

  return (
    <div className="space-y-4">

      {/* FILTERS / BULK */}
      <div className="flex gap-3 items-center">
        <select
            value={bulkAction}
            onChange={(e) =>
                setBulkAction(e.target.value as BulkAction)
            }
            className="border rounded px-2 py-1 text-sm"
            >
            <option value="">{t.bulkActions}</option>
            <option value="make-admin">{t.makeAdmin}</option>
            <option value="make-user">{t.makeUser}</option>
            <option value="delete">{t.delete}</option>
            </select>

        <button
            onClick={applyBulkAction}
            disabled={loading || selected.length === 0}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50"
            >
            {loading ? t.busy : t.apply}
        </button>


        <input
            type="search"
            value={search}
            onChange={(e) => {
                setSearch(e.target.value);
                setSelected([]); // 👈 zoals WordPress
            }}
            placeholder={t.searchPlaceholder}
            className="border rounded px-2 py-1 text-sm w-64"
            />

        <select
          value={roleFilter}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "all" || value === "user" || value === "admin") {
              setRoleFilter(value);
            }
          }}
          className="ml-auto border rounded px-2 py-1 text-sm"
        >
          <option value="all">{t.allRoles}</option>
          <option value="admin">{t.admins}</option>
          <option value="user">{t.users}</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="border rounded bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-2">
                <input
                  type="checkbox"
                  checked={
                    filteredUsers.length > 0 &&
                    selected.length === filteredUsers.length
                  }
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </th>
              <th className="text-left px-2 py-2">{t.name}</th>
              <th className="text-left px-2 py-2">{t.email}</th>
              <th className="text-left px-2 py-2">{t.role}</th>
              <th className="text-right px-2 py-2">{t.credits}</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(u.id)}
                    onChange={() => toggleOne(u.id)}
                  />
                </td>
                <td className="px-2 py-2 font-medium">
                  <Link
                    href={resolveAdminBrowserHref(pathname, `/admin/users/${u.id}`)}
                    className="text-[#2271b1] hover:underline"
                  >
                    {u.display_name ?? "—"}
                  </Link>
                </td>
                <td className="px-2 py-2">{u.email}</td>
                <td className="px-2 py-2">
                    {u.id === currentAdminId ? (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                        {t.you} ({u.role})
                        </span>
                    ) : (
                        <select
                        value={u.role}
                        onChange={async (e) => {
                            const nextRole = e.target.value as "admin" | "user";
                            await updateUserRole(u.id, nextRole);
                            location.reload(); // simpel & veilig
                        }}
                        className="rounded border px-2 py-1 text-xs"
                        >
                        <option value="user">{t.user}</option>
                        <option value="admin">{t.admin}</option>
                        </select>
                    )}
                    </td>
                <td className="px-2 py-2 text-right">
                  {u.credits}
                </td>
              </tr>
            ))}
          </tbody>
          {filteredUsers.length === 0 && (
            <div className="text-sm text-gray-500 p-4">
                {t.noUsersFound}
            </div>
            )}
        </table>
      </div>
    </div>
  );
}
