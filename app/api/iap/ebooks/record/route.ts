import { NextResponse } from "next/server";
import { getEbookProductByStoreProductId, grantEbookPurchaseFromStore } from "@/lib/shop/ebook-products";

const INTERNAL_SECRET = process.env.IAP_INTERNAL_SECRET;

type Payload = {
  platform: "apple" | "google";
  storeTransactionId: string;
  storeProductId: string;
  userId?: string | null;
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

  if (
    !payload?.platform ||
    !payload.storeTransactionId ||
    !payload.storeProductId ||
    !payload.userId
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const item = await getEbookProductByStoreProductId(
    payload.platform,
    payload.storeProductId
  );

  if (!item) {
    return NextResponse.json(
      { error: "No ebook mapping found for this store product id." },
      { status: 404 }
    );
  }

  await grantEbookPurchaseFromStore({
    userId: payload.userId,
    item,
    platform: payload.platform,
    storeTransactionId: payload.storeTransactionId,
    storeProductId: payload.storeProductId,
    amountCents: payload.amountCents ?? null,
    currency: payload.currency ?? null,
    rawPayload: payload.rawPayload ?? null,
  });

  return NextResponse.json({
    ok: true,
    mapped: true,
    productId: item.id,
    readerPath: `/account/ebooks/product/${item.id}`,
  });
}
