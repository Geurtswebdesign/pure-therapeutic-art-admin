"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  getPublicEbookProductBySlug,
  grantDirectEbookPurchase,
} from "@/lib/shop/ebook-products";
import { getEbookPurchaseMode } from "@/lib/shop/ebook-purchase-mode";

export async function purchaseEbookInApp(productSlug: string) {
  if (getEbookPurchaseMode() !== "direct_grant") {
    throw new Error("EBOOK_PURCHASE_DISABLED");
  }

  const user = await getCurrentUser();
  if (!user) {
    throw new Error("EBOOK_LOGIN_REQUIRED");
  }

  const item = await getPublicEbookProductBySlug(productSlug);
  if (!item) {
    throw new Error("EBOOK_NOT_FOUND");
  }

  await grantDirectEbookPurchase(user.id, item);

  revalidatePath(`/shop/ebooks/${productSlug}`);
  revalidatePath("/account");
}
