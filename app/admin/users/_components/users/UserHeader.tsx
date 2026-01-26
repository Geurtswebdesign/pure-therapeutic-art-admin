import type { AdminUserProfile } from "../../_lib/types.ts";

export default function UserHeader({
  profile,
}: {
  profile: AdminUserProfile;
}) {
  return (
    <div className="border p-4 rounded bg-white">
      <h1 className="text-xl font-semibold">
        {profile.display_name ?? "Onbekende gebruiker"}
      </h1>
      <p className="text-sm text-gray-600">
        Rol: {profile.role}
      </p>
    </div>
  );
}
