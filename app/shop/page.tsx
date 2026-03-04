import PublicAppShell from "@/components/public/PublicAppShell";

export default async function ShopPage() {
  return (
    <PublicAppShell activeTab="shop" title="Shop" subtitle="Materialen en tools">
      <section className="space-y-4">
        <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-2xl text-stone-950">
            Winkelomgeving
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Dit scherm reserveren we voor producten, werkboeken en later ook de
            in-app aankopen.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {["Werkboek", "Kaartenset", "Audio", "Bundels"].map((label) => (
            <article
              key={label}
              className="min-h-[120px] rounded-[1.4rem] border border-stone-200 bg-[#efe6dc] p-4"
            >
              <h3 className="text-sm font-medium text-stone-900">{label}</h3>
              <p className="mt-2 text-xs leading-5 text-stone-600">
                Nog niet ingericht.
              </p>
            </article>
          ))}
        </div>
      </section>
    </PublicAppShell>
  );
}
