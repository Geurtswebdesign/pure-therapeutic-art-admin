import { NextResponse } from "next/server";
import { recordIapNotification } from "@/lib/iap/storage";

const WEBHOOK_SECRET = process.env.IAP_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (WEBHOOK_SECRET) {
    const secret = request.headers.get("x-iap-secret");
    if (secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const notificationType =
    typeof (payload as { notificationType?: string }).notificationType === "string"
      ? (payload as { notificationType?: string }).notificationType
      : typeof (payload as { notification_type?: string }).notification_type === "string"
        ? (payload as { notification_type?: string }).notification_type
        : null;
  const subtype =
    typeof (payload as { subtype?: string }).subtype === "string"
      ? (payload as { subtype?: string }).subtype
      : null;

  await recordIapNotification({
    platform: "apple",
    notificationType,
    subtype,
    rawPayload: payload,
  });

  return NextResponse.json({ ok: true });
}
