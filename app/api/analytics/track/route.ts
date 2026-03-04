import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

type TrackPayload = {
  event_type?: string;
  event_name?: string | null;
  event_category?: string | null;
  event_label?: string | null;
  event_value?: number | null;
  path?: string;
  page_title?: string | null;
  referrer?: string | null;
  referrer_host?: string | null;
  referrer_type?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  utm_id?: string | null;
  anon_id?: string | null;
  session_id?: string | null;
  user_agent?: string | null;
  device_type?: string | null;
  os?: string | null;
  browser?: string | null;
  language?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  screen_width?: number | null;
  screen_height?: number | null;
};

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as TrackPayload;
    const hdrs = await headers();
    const userAgent = payload.user_agent ?? hdrs.get("user-agent");

    if (!payload.path || !payload.event_type) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("analytics_events").insert({
      event_type: payload.event_type,
      event_name: payload.event_name ?? null,
      event_category: payload.event_category ?? null,
      event_label: payload.event_label ?? null,
      event_value: payload.event_value ?? null,
      path: payload.path,
      page_title: payload.page_title ?? null,
      referrer: payload.referrer ?? hdrs.get("referer"),
      referrer_host: payload.referrer_host ?? null,
      referrer_type: payload.referrer_type ?? null,
      utm_source: payload.utm_source ?? null,
      utm_medium: payload.utm_medium ?? null,
      utm_campaign: payload.utm_campaign ?? null,
      utm_content: payload.utm_content ?? null,
      utm_term: payload.utm_term ?? null,
      utm_id: payload.utm_id ?? null,
      anon_id: payload.anon_id ?? null,
      session_id: payload.session_id ?? null,
      user_agent: userAgent,
      device_type: payload.device_type ?? null,
      os: payload.os ?? null,
      browser: payload.browser ?? null,
      language: payload.language ?? null,
      country: payload.country ?? null,
      region: payload.region ?? null,
      city: payload.city ?? null,
      screen_width: payload.screen_width ?? null,
      screen_height: payload.screen_height ?? null,
    });

    if (error) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
