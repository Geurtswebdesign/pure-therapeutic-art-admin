import PublicAppShell from "@/components/public/PublicAppShell";
import { getEvents } from "@/lib/events/getEvents";
import type { AppEvent } from "@/lib/events/types";

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

function formatDateParts(value: string | null) {
  if (!value) {
    return { day: "--", month: "---", weekday: "---", time: "--:--" };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { day: "--", month: "---", weekday: "---", time: "--:--" };
  }

  return {
    day: date.toLocaleDateString("nl-NL", { day: "2-digit" }),
    month: date
      .toLocaleDateString("nl-NL", { month: "short" })
      .replace(".", "")
      .toUpperCase(),
    weekday: date.toLocaleDateString("nl-NL", { weekday: "short" }),
    time: date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function toSafeBookingUrl(event: AppEvent) {
  const rawHref = (event.bookingUrl || event.listUrl || "").trim();
  if (!rawHref) return "#";

  try {
    const parsed = new URL(rawHref);
    const base = `${parsed.origin}${parsed.pathname}`;

    if (event.title && event.nextOccurrence) {
      return `${base}?pta_open=1&pta_title=${encodeURIComponent(
        event.title,
      )}&pta_start=${encodeURIComponent(event.nextOccurrence)}`;
    }

    return rawHref;
  } catch {
    return rawHref;
  }
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
            Pure Therapeutic ART trainingen
          </h2>
          <div className="mt-3 h-1 w-24 rounded-full bg-[#b64040]" />
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

        <div className="grid gap-4">
          {(events ?? []).map((event) => (
            <article
              key={`${event.id}-${event.nextOccurrence ?? "no-date"}`}
              className="overflow-hidden rounded-[1.5rem] border border-[#e5dbcf] bg-white shadow-[0_12px_30px_rgba(31,24,19,0.08)]"
            >
              <div className="h-1 w-full bg-[#b64040]" />
              <div className="grid grid-cols-[84px_1fr] gap-0">
                <div className="flex flex-col items-center justify-center border-r border-[#eee3d8] bg-[#f6eee6] px-2 py-4 text-center">
                  {(() => {
                    const parts = formatDateParts(event.nextOccurrence);
                    return (
                      <>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
                          {parts.weekday}
                        </span>
                        <span className="mt-1 text-3xl font-semibold leading-none text-stone-900">
                          {parts.day}
                        </span>
                        <span className="mt-1 text-xs uppercase tracking-[0.1em] text-stone-600">
                          {parts.month}
                        </span>
                        <span className="mt-3 rounded-full border border-[#e7b8b8] bg-[#fff4f4] px-2 py-0.5 text-[11px] text-[#9e3a3a]">
                          {parts.time}
                        </span>
                      </>
                    );
                  })()}
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold leading-6 text-stone-900">
                      {event.title}
                    </h3>
                    <span className="shrink-0 rounded-full border border-[#e7b8b8] bg-[#fff4f4] px-2.5 py-1 text-xs text-[#9e3a3a]">
                      {event.price > 0 ? `EUR ${event.price.toFixed(2)}` : "Gratis"}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600">
                    Start: {formatDateTime(event.nextOccurrence)}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f1e8de] pt-2">
                    <div className="flex items-center gap-3 text-[11px] text-stone-500">
                      <span>{event.occurrenceCount} sessies</span>
                      {event.capacity ? <span>Max {event.capacity}</span> : null}
                    </div>

                    {event.bookingUrl || event.listUrl ? (
                      <a
                        href={toSafeBookingUrl(event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-full border border-[#9e3a3a] bg-[#b64040] px-4 py-1.5 text-xs font-medium text-white transition hover:bg-[#9e3a3a]"
                      >
                        Boek nu
                      </a>
                    ) : (
                      <span className="inline-flex rounded-full bg-stone-300 px-4 py-1.5 text-xs text-stone-700">
                        Geen boekingslink
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicAppShell>
  );
}
