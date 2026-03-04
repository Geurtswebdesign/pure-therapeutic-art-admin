import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordIapTransaction } from "@/lib/iap/storage";
import { logServerEvent } from "@/lib/analytics/server";

const INTERNAL_SECRET = process.env.IAP_INTERNAL_SECRET;

type Payload = {
  platform: "apple" | "google";
  storeTransactionId: string;
  storeProductId: string;
  userId?: string | null;
  quantity?: number;
  amountCents?: number | null;
  currency?: string | null;
  rawPayload?: unknown;
};

export async function POST(request: Request) {
  if (INTERNAL_SECRET) {
    const secret = request.headers.get("x-iap-secret");
    if (secret !== INTERNAL_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload?.platform || !payload.storeTransactionId || !payload.storeProductId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const record = await recordIapTransaction({
    platform: payload.platform,
    storeTransactionId: payload.storeTransactionId,
    storeProductId: payload.storeProductId,
    userId: payload.userId ?? null,
    quantity: payload.quantity ?? 1,
    amountCents: payload.amountCents ?? null,
    currency: payload.currency ?? null,
    rawPayload: payload.rawPayload ?? null,
  });

  if (!record.ok) {
    return NextResponse.json({ error: record.error ?? "Failed" }, { status: 500 });
  }

  if (!record.packId) {
    return NextResponse.json({
      ok: true,
      recorded: true,
      mapped: false,
      message: "No active pack mapping for this store product id.",
    });
  }

  if (record.alreadyRecorded) {
    return NextResponse.json({ ok: true, recorded: false, mapped: true });
  }

  if (!payload.userId) {
    return NextResponse.json({
      ok: true,
      recorded: true,
      mapped: true,
      message: "Transaction recorded but no user id provided for credit grant.",
    });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("admin_record_credit_pack_purchase", {
    p_user_id: payload.userId,
    p_pack_id: record.packId,
    p_quantity: Math.max(1, payload.quantity ?? 1),
    p_note: `${payload.platform} iap ${payload.storeTransactionId}`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logServerEvent({
    eventName: "purchase_completed",
    eventCategory: "ecommerce",
    eventLabel: payload.storeProductId,
    eventValue: payload.quantity ?? 1,
    path: "/api/iap/record",
  });

  return NextResponse.json({ ok: true, recorded: true, mapped: true, credited: true });
}
