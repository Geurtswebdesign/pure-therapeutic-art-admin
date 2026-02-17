import type { AdminUserProfile } from "@/lib/users/types";

type Props = {
  user: AdminUserProfile;
};

export default function UserHeader({ user }: Props) {
  const displayName = user.display_name ?? user.email ?? "—";
  const createdAt = user.created_at ? new Date(user.created_at) : null;

  return (
    <section className="rounded border bg-white p-4 space-y-1">
      <h1 className="text-xl font-semibold">{displayName}</h1>

      {user.email && (
        <p className="text-sm text-gray-600">{user.email}</p>
      )}

      {createdAt && (
        <p className="text-xs text-gray-500">
          Aangemaakt: {createdAt.toLocaleString("nl-NL")}
        </p>
      )}
    </section>
  );
}
