export default function SettingsEmailPage() {
  return (
    <section className="space-y-4 rounded border bg-white p-5">
      <h2 className="text-lg font-semibold">Email</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
        <li>SMTP-configuratie</li>
        <li>Transactionele templates</li>
        <li>Ontgrendel e-mailtemplate</li>
        <li>Herinnering e-mailtemplate</li>
        <li>Branding-variabelen</li>
      </ul>
    </section>
  );
}
