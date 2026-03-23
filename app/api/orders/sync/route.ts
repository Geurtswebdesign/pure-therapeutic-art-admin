import { NextResponse } from "next/server";
import { syncWebsiteOrderItems, type WebsiteOrderSyncItemInput } from "@/lib/account/website-orders";

const ORDER_SYNC_SECRET = process.env.WEBSITE_ORDER_SYNC_SECRET;

type Payload = {
  source?: string | null;
  items?: WebsiteOrderSyncItemInput[];
};

export async function POST(request: Request) {
  if (ORDER_SYNC_SECRET) {
    const secret = request.headers.get("x-order-sync-secret");
    if (secret !== ORDER_SYNC_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(payload.items) || !payload.items.length) {
    return NextResponse.json({ error: "Missing items" }, { status: 400 });
  }

  const invalidItem = payload.items.find(
    (item) =>
      !item?.externalOrderId?.trim() ||
      !item?.externalLineId?.trim() ||
      !item?.kind ||
      !item?.title?.trim()
  );

  if (invalidItem) {
    return NextResponse.json(
      { error: "Each item requires externalOrderId, externalLineId, kind and title" },
      { status: 400 }
    );
  }

  const result = await syncWebsiteOrderItems({
    source: payload.source ?? "website",
    items: payload.items,
  });

  return NextResponse.json({
    ok: true,
    received: result.received,
    upserted: result.upserted,
  });
}
