export default function SettingsSecurityPage() {
  return (
    <section className="space-y-4 rounded border bg-white p-5">
      <h2 className="text-lg font-semibold">Security</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
        <li>Login attempts limit</li>
        <li>Admin session timeout</li>
        <li>2FA policy</li>
        <li>Rate limiting</li>
        <li>API keys en webhook secrets</li>
      </ul>
    </section>
  );
}
