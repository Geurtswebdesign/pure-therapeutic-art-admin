export default function SettingsAppPage() {
  return (
    <section className="space-y-4 rounded border bg-white p-5">
      <h2 className="text-lg font-semibold">App</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
        <li>Minimum app version</li>
        <li>Force update toggle</li>
        <li>App Store product IDs</li>
        <li>IAP validation toggle</li>
        <li>Maintenance mode</li>
      </ul>
    </section>
  );
}
