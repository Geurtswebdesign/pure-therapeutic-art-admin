export default function SettingsSystemPage() {
  return (
    <section className="space-y-4 rounded border bg-white p-5">
      <h2 className="text-lg font-semibold">System</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
        <li>Feature flags</li>
        <li>Cache clear</li>
        <li>Rebuild search index</li>
        <li>Queue monitor</li>
        <li>Logs viewer en DB health check</li>
      </ul>
    </section>
  );
}
