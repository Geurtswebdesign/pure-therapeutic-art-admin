export default function SettingsSystemPage() {
  return (
    <section className="space-y-4 rounded border bg-white p-5">
      <h2 className="text-lg font-semibold">Systeem</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
        <li>Feature flags</li>
        <li>Cache legen</li>
        <li>Zoekindex opnieuw opbouwen</li>
        <li>Queue-monitor</li>
        <li>Logviewer en database-health check</li>
      </ul>
    </section>
  );
}
