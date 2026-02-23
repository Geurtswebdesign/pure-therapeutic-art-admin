export default function InsightsPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Inzichten</h1>
        <p className="text-sm text-gray-600">
          Business intelligence voor omzet, unlock-gedrag en funnelstatistieken.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded border bg-white p-4">
          <h2 className="text-base font-semibold">Omzet</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
            <li>Omzet per dag, week en maand</li>
            <li>Gemiddelde unlock-prijs</li>
            <li>Conversieratio</li>
          </ul>
        </article>

        <article className="rounded border bg-white p-4">
          <h2 className="text-base font-semibold">Gebruikersgedrag</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
            <li>Voltooiingsratio</li>
            <li>Uitval per contenttype</li>
            <li>Meest ontgrendelde content</li>
          </ul>
        </article>

        <article className="rounded border bg-white p-4">
          <h2 className="text-base font-semibold">Trechter</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
            <li>Credits gekocht</li>
            <li>Credits besteed</li>
            <li>Ontgrendelratio</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
