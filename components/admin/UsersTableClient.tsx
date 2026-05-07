"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  bulkUpdateUserRole,
  bulkDeleteUsers,
  updateUserApprovalStatus,
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
  approval_status?: "approved" | "pending" | "rejected";
  subscriptions?: {
    hasYearAssignments: boolean;
    yearAssignmentsActiveUntil: string | null;
    hasTherapistDirectory: boolean;
    therapistDirectoryActiveUntil: string | null;
  };
  directoryVisibility?: {
    accountType: "user" | "client" | "therapist";
    publicProfileEnabled: boolean;
    isVisibleInTherapistDirectory: boolean;
  };
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
  type ApprovalFilter = "all" | "approved" | "pending" | "rejected";

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  type BulkAction =
  | ""
  | "make-admin"
  | "make-user"
  | "delete";

  const [bulkAction, setBulkAction] = useState<BulkAction>("");
  
  const filteredUsers = users.filter((u) => {
    const matchesRole =
        roleFilter === "all" || u.role === roleFilter;
    const approvalStatus = u.approval_status ?? "approved";
    const matchesApproval =
        approvalFilter === "all" || approvalStatus === approvalFilter;

    const q = search.toLowerCase();
    const matchesSearch =
        !q ||
        u.display_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);

    return matchesRole && matchesApproval && matchesSearch;
    });

  function getApprovalLabel(status: User["approval_status"]) {
    if (status === "pending") return "Wacht op goedkeuring";
    if (status === "rejected") return "Geweigerd";
    return "Goedgekeurd";
  }

  function formatDate(value: string | null) {
    if (!value) {
      return t.indefinite;
    }

    return new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  }

  function getSubscriptionBadges(user: User) {
    const subscriptions = user.subscriptions;
    if (!subscriptions) {
      return [];
    }

    return [
      subscriptions.hasYearAssignments
        ? {
            label: t.yearSubscription,
            activeUntil: subscriptions.yearAssignmentsActiveUntil,
            className: "bg-indigo-50 text-indigo-700 ring-indigo-100",
          }
        : null,
      subscriptions.hasTherapistDirectory
        ? {
            label: t.therapistSubscription,
            activeUntil: subscriptions.therapistDirectoryActiveUntil,
            className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
          }
        : null,
    ].filter(
      (
        item
      ): item is {
        label: string;
        activeUntil: string | null;
        className: string;
      } => Boolean(item)
    );
  }

  function getDirectoryVisibilityReason(user: User) {
    const visibility = user.directoryVisibility;
    if (!visibility) {
      return t.hiddenInDirectory;
    }

    if (visibility.isVisibleInTherapistDirectory) {
      return t.visibleInDirectory;
    }

    if (visibility.accountType !== "therapist") {
      return t.notTherapist;
    }

    if (!visibility.publicProfileEnabled) {
      return t.profileDisabled;
    }

    return t.subscriptionMissing;
  }

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
    setError(null);

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
        try {
          await bulkDeleteUsers(safeIds);
          location.reload();
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Gebruikers verwijderen mislukt");
        } finally {
          setLoading(false);
        }
        return;
    }

    if (bulkAction === "make-admin") {
        setLoading(true);
        try {
          await bulkUpdateUserRole(safeIds, "admin");
          location.reload();
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Rol wijzigen mislukt");
        } finally {
          setLoading(false);
        }
        return;
    }

    if (bulkAction === "make-user") {
        setLoading(true);
        try {
          await bulkUpdateUserRole(safeIds, "user");
          location.reload();
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Rol wijzigen mislukt");
        } finally {
          setLoading(false);
        }
        return;
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

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

        <select
          value={approvalFilter}
          onChange={(e) => {
            const value = e.target.value;
            if (
              value === "all" ||
              value === "approved" ||
              value === "pending" ||
              value === "rejected"
            ) {
              setApprovalFilter(value);
            }
          }}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="all">Alle statussen</option>
          <option value="pending">Wacht op goedkeuring</option>
          <option value="approved">Goedgekeurd</option>
          <option value="rejected">Geweigerd</option>
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
              <th className="text-left px-2 py-2">{t.subscriptions}</th>
              <th className="text-left px-2 py-2">{t.therapistDirectory}</th>
              <th className="text-left px-2 py-2">Status</th>
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
                <td className="px-2 py-2">
                  {getSubscriptionBadges(u).length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {getSubscriptionBadges(u).map((subscription) => (
                        <span
                          key={subscription.label}
                          className={`inline-flex rounded px-2 py-0.5 text-xs ring-1 ${subscription.className}`}
                        >
                          {subscription.label}: {formatDate(subscription.activeUntil)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {t.noActiveSubscriptions}
                    </span>
                  )}
                </td>
                <td className="px-2 py-2">
                  <span
                    className={`inline-flex rounded px-2 py-0.5 text-xs ring-1 ${
                      u.directoryVisibility?.isVisibleInTherapistDirectory
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                        : "bg-gray-50 text-gray-500 ring-gray-200"
                    }`}
                  >
                    {getDirectoryVisibilityReason(u)}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        u.approval_status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : u.approval_status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {getApprovalLabel(u.approval_status)}
                    </span>
                    {u.id !== currentAdminId && u.approval_status !== "approved" ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await updateUserApprovalStatus(u.id, "approved");
                          location.reload();
                        }}
                        className="rounded border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                      >
                        Goedkeuren
                      </button>
                    ) : null}
                    {u.id !== currentAdminId && u.approval_status !== "rejected" ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await updateUserApprovalStatus(u.id, "rejected");
                          location.reload();
                        }}
                        className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        Weigeren
                      </button>
                    ) : null}
                  </div>
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
