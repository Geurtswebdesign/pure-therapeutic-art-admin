import PublicAppShell from "@/components/public/PublicAppShell";
import { getEvents } from "@/lib/events/getEvents";

function formatDateTime(value: string | null) {
  if (!value) return "Nog geen datum";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("nl-NL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TrainingenPage() {
  let events:
    | Awaited<ReturnType<typeof getEvents>>
    | null = null;
  let loadError: string | null = null;

  try {
    events = await getEvents({ limit: 40, includeOccurrences: true });
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Onbekende fout";
  }

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
            Bekijk alle aankomende trainingen en open direct het boekingsvenster.
          </p>
        </div>

        {loadError ? (
          <article className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4">
            <h3 className="text-base font-medium text-red-800">
              Trainingen konden niet geladen worden
            </h3>
            <p className="mt-2 text-sm text-red-700">
              Controleer of de Supabase function `wp-events` gedeployed is.
            </p>
            <p className="mt-2 text-xs text-red-700">{loadError}</p>
          </article>
        ) : null}

        {!loadError && !events?.length ? (
          <article className="rounded-[1.5rem] border border-stone-200 bg-[#f6f1eb] p-4">
            <h3 className="text-base font-medium text-stone-900">
              Nog geen trainingen gevonden
            </h3>
            <p className="mt-1 text-sm text-stone-600">
              Zodra er events in WordPress/Amelia staan, verschijnen ze hier.
            </p>
          </article>
        ) : null}

        <div className="grid gap-3">
          {(events ?? []).map((event) => (
            <article
              key={`${event.id}-${event.nextOccurrence ?? "no-date"}`}
              className="rounded-[1.5rem] border border-stone-200 bg-[#f6f1eb] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-medium text-stone-900">
                  {event.title}
                </h3>
                <span className="rounded-full bg-stone-200 px-2 py-1 text-xs text-stone-700">
                  {event.price > 0 ? `EUR ${event.price.toFixed(2)}` : "Gratis"}
                </span>
              </div>

              <p className="mt-1 text-sm text-stone-600">
                {formatDateTime(event.nextOccurrence)}
              </p>

              {event.capacity ? (
                <p className="mt-1 text-xs text-stone-500">
                  Capaciteit: {event.capacity}
                </p>
              ) : null}

              <div className="mt-3">
                {event.bookingUrl || event.listUrl ? (
                  <a
                    href={event.bookingUrl || event.listUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-full bg-stone-900 px-4 py-2 text-sm text-white"
                  >
                    Boek nu
                  </a>
                ) : (
                  <span className="inline-flex rounded-full bg-stone-300 px-4 py-2 text-sm text-stone-700">
                    Geen boekingslink
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicAppShell>
  );
}
