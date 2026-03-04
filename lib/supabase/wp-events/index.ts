import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const WP_EVENTS_URL =
  Deno.env.get("WP_EVENTS_URL") ??
  "https://detroostboom.nl/wp-json/pta/v1/events";
const WP_TOKEN = Deno.env.get("WP_EVENTS_TOKEN") ?? "";

function withCors(res: Response) {
  const h = new Headers(res.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Headers", "authorization, content-type");
  h.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return new Response(res.body, { status: res.status, headers: h });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return withCors(new Response(null, { status: 204 }));

  const url = new URL(req.url);
  const limit = url.searchParams.get("limit") ?? "50";
  const from = url.searchParams.get("from") ?? "";
  const includeOccurrences = url.searchParams.get("includeOccurrences") ?? "0";

  const wpUrl = new URL(WP_EVENTS_URL);
  wpUrl.searchParams.set("limit", limit);
  if (from) wpUrl.searchParams.set("from", from);
  wpUrl.searchParams.set("includeOccurrences", includeOccurrences);

  const headers: Record<string, string> = {
    "Accept": "application/json",
  };
  if (WP_TOKEN) headers["Authorization"] = `Bearer ${WP_TOKEN}`;

  const resp = await fetch(wpUrl.toString(), { headers });
  const body = await resp.text();

  return withCors(new Response(body, {
    status: resp.status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // cache 60s at edge/CDN, safe for events
      "cache-control": "public, s-maxage=60, max-age=30",
    },
  }));
});
