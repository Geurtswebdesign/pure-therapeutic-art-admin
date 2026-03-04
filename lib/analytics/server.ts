import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

type ServerEventInput = {
  eventName: string;
  eventCategory?: string;
  eventLabel?: string;
  eventValue?: number;
  path?: string;
};

export async function logServerEvent(input: ServerEventInput) {
  try {
    const hdrs = await headers();
    const referrer = hdrs.get("referer");
    const userAgent = hdrs.get("user-agent");

    const supabase = createAdminClient();
    await supabase.from("analytics_events").insert({
      event_type: "event",
      event_name: input.eventName,
      event_category: input.eventCategory ?? null,
      event_label: input.eventLabel ?? null,
      event_value: input.eventValue ?? null,
      path: input.path ?? "/",
      referrer,
      user_agent: userAgent,
    });
  } catch {
    // noop
  }
}
