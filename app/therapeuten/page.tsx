import PublicAppShell from "@/components/public/PublicAppShell";

export default async function TherapeutenPage() {
  return (
    <PublicAppShell
      activeTab="therapeuten"
      title="Therapeuten"
      subtitle="Begeleiding en contact"
    >
      <section className="space-y-4">
        <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-2xl text-stone-950">
            Vind een therapeut
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Dit wordt het overzicht voor aangesloten therapeuten, profielen en
            contactmogelijkheden.
          </p>
        </div>

        <div className="space-y-3">
          {["Traumaverwerking", "Rouw", "Creative ART therapy"].map((label) => (
            <article
              key={label}
              className="rounded-[1.5rem] border border-stone-200 bg-[#f6f1eb] p-4"
            >
              <h3 className="text-base font-medium text-stone-900">{label}</h3>
              <p className="mt-1 text-sm text-stone-600">
                Binnenkort vullen we hier therapeuten en beschikbaarheid.
              </p>
            </article>
          ))}
        </div>
      </section>
    </PublicAppShell>
  );
}
