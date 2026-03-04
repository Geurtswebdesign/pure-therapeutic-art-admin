import PublicAppShell from "@/components/public/PublicAppShell";

export default async function TrainingenPage() {
  return (
    <PublicAppShell
      activeTab="trainingen"
      title="Trainingen"
      subtitle="Kalender en oefeningen"
    >
      <section className="space-y-4">
        <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-2xl text-stone-950">
            Kalender en ritme
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Hier bouwen we het overzicht met trainingen, sessies en persoonlijke
            planning.
          </p>
        </div>

        <div className="grid gap-3">
          {["Vandaag", "Deze week", "Aankomende sessies"].map((label) => (
            <article
              key={label}
              className="rounded-[1.5rem] border border-stone-200 bg-[#f6f1eb] p-4"
            >
              <h3 className="text-base font-medium text-stone-900">{label}</h3>
              <p className="mt-1 text-sm text-stone-600">
                Nog geen items toegevoegd.
              </p>
            </article>
          ))}
        </div>
      </section>
    </PublicAppShell>
  );
}
