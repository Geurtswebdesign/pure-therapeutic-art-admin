export default function SettingsSecurityPage() {
  return (
    <section className="space-y-4 rounded border bg-white p-5">
      <h2 className="text-lg font-semibold">Beveiliging</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
        <li>Limiet voor inlogpogingen</li>
        <li>Admin-sessietimeout</li>
        <li>2FA-beleid</li>
        <li>Rate limiting</li>
        <li>API-sleutels en webhook-secrets</li>
      </ul>
    </section>
  );
}
