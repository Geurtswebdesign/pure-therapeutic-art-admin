import "server-only";
import type { AppEvent } from "./types";

export async function getEvents(params?: {
  limit?: number;
  from?: string; // YYYY-MM-DD
  includeOccurrences?: boolean;
}): Promise<AppEvent[]> {
  const limit = params?.limit ?? 50;
  const from = params?.from ?? "";
  const includeOccurrences = params?.includeOccurrences ? "1" : "0";

  const url = resolveEventsUrl();
  url.searchParams.set("limit", String(limit));
  if (from) url.searchParams.set("from", from);
  url.searchParams.set("includeOccurrences", includeOccurrences);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (isDirectWpUrl(url)) {
    const token = process.env.WP_EVENTS_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers,
  });
  if (!res.ok) throw new Error(`Failed to load events: ${res.status}`);

  const json = await res.json();
  return normalizeEvents(json.items ?? []);
}

function resolveFunctionsBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;
  if (explicit) return explicit;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL or NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  return supabaseUrl.replace(".supabase.co", ".functions.supabase.co");
}

function resolveEventsUrl() {
  const directWpUrl = process.env.WP_EVENTS_URL;
  if (directWpUrl) return new URL(directWpUrl);

  const functionsBase = resolveFunctionsBaseUrl();
  return new URL(`${functionsBase}/wp-events`);
}

function isDirectWpUrl(url: URL) {
  const directWpUrl = process.env.WP_EVENTS_URL;
  return Boolean(directWpUrl && url.toString().startsWith(directWpUrl));
}

function normalizeEvents(input: unknown[]): AppEvent[] {
  return input
    .map((row) => {
      const item = row as Record<string, unknown>;
      const id = Number(item.id ?? item.ameliaEventId ?? 0);
      if (!Number.isFinite(id) || id <= 0) return null;

      return {
        id,
        title: String(item.title ?? ""),
        descriptionHtml: String(item.descriptionHtml ?? item.description_html ?? ""),
        ameliaEventId: Number(item.ameliaEventId ?? id),
        price: Number(item.price ?? 0),
        capacity:
          item.capacity === null || item.capacity === undefined
            ? null
            : Number(item.capacity),
        nextOccurrence:
          typeof item.nextOccurrence === "string"
            ? item.nextOccurrence
            : typeof item.next_occurrence === "string"
              ? item.next_occurrence
              : null,
        occurrenceCount: Number(item.occurrenceCount ?? item.occurrence_count ?? 0),
        occurrences: Array.isArray(item.occurrences)
          ? item.occurrences
              .map((occ) => {
                const value = occ as Record<string, unknown>;
                if (typeof value.start !== "string") return null;
                return {
                  start: value.start,
                  end: typeof value.end === "string" ? value.end : undefined,
                };
              })
              .filter((occ): occ is NonNullable<typeof occ> => Boolean(occ))
          : undefined,
        bookingUrl: String(item.bookingUrl ?? item.booking_url ?? ""),
        listUrl:
          typeof item.listUrl === "string"
            ? item.listUrl
            : typeof item.list_url === "string"
              ? item.list_url
              : null,
        updatedAt:
          typeof item.updatedAt === "string"
            ? item.updatedAt
            : typeof item.updated_at === "string"
              ? item.updated_at
              : null,
      } as AppEvent;
    })
    .filter(
      (event): event is AppEvent =>
        Boolean(event && (event.bookingUrl || event.listUrl))
    );
}
