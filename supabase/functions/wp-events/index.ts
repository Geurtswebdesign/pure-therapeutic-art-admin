import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const WP_EVENTS_URL =
  Deno.env.get("WP_EVENTS_URL") ??
  "https://detroostboom.nl/wp-json/pta/v1/events";
const WP_TOKEN = Deno.env.get("WP_EVENTS_TOKEN") ?? "";

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Headers", "authorization, content-type");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return new Response(response.body, { status: response.status, headers });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

  if (req.method !== "GET") {
    return withCors(
      new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "content-type": "application/json; charset=utf-8" },
      })
    );
  }

  const url = new URL(req.url);
  const limit = url.searchParams.get("limit") ?? "50";
  const from = url.searchParams.get("from") ?? "";
  const includeOccurrences = url.searchParams.get("includeOccurrences") ?? "0";

  const wpUrl = new URL(WP_EVENTS_URL);
  wpUrl.searchParams.set("limit", limit);
  if (from) wpUrl.searchParams.set("from", from);
  wpUrl.searchParams.set("includeOccurrences", includeOccurrences);

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (WP_TOKEN) headers.Authorization = `Bearer ${WP_TOKEN}`;

  try {
    const wpResponse = await fetch(wpUrl.toString(), { headers });
    const body = await wpResponse.text();

    return withCors(
      new Response(body, {
        status: wpResponse.status,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, s-maxage=60, max-age=30",
        },
      })
    );
  } catch (error) {
    return withCors(
      new Response(
        JSON.stringify({
          error: "wp_upstream_failed",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 502,
          headers: { "content-type": "application/json; charset=utf-8" },
        }
      )
    );
  }
});
