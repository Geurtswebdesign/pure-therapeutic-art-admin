import { NextResponse } from "next/server";
import { sendTherapistProfileReminderBatch } from "@/lib/users/therapistProfileReminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.THERAPIST_PROFILE_REMINDER_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization = request.headers.get("authorization")?.trim();
  const headerSecret = request.headers.get("x-cron-secret")?.trim();

  return authorization === `Bearer ${secret}` || headerSecret === secret;
}

function isDryRun(request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get("dryRun") === "1";
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendTherapistProfileReminderBatch({
    dryRun: isDryRun(request),
  });

  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: Request) {
  return GET(request);
}
