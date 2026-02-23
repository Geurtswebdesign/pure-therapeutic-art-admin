export default function InsightsPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Insights</h1>
        <p className="text-sm text-gray-600">
          Business intelligence voor omzet, unlock-gedrag en funnel metrics.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded border bg-white p-4">
          <h2 className="text-base font-semibold">Revenue</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
            <li>Omzet per dag, week en maand</li>
            <li>Gemiddelde unlock-prijs</li>
            <li>Conversieratio</li>
          </ul>
        </article>

        <article className="rounded border bg-white p-4">
          <h2 className="text-base font-semibold">User Behavior</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
            <li>Completion ratio</li>
            <li>Drop-off per content type</li>
            <li>Meest ontgrendelde content</li>
          </ul>
        </article>

        <article className="rounded border bg-white p-4">
          <h2 className="text-base font-semibold">Funnel</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
            <li>Credits gekocht</li>
            <li>Credits besteed</li>
            <li>Unlock ratio</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
