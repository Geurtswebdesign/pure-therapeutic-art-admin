export default function SettingsAppPage() {
  return (
    <section className="space-y-4 rounded border bg-white p-5">
      <h2 className="text-lg font-semibold">App</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
        <li>Minimale appversie</li>
        <li>Force-update schakelaar</li>
        <li>App Store-product-ID&apos;s</li>
        <li>IAP-validatie schakelaar</li>
        <li>Onderhoudsmodus</li>
      </ul>
    </section>
  );
}
