export default function UserHeader({ profile }: { profile: any }) {
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
