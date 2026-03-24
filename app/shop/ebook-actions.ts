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
    throw new Error("De in-app betaalkoppeling is nog niet actief.");
  }

  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Log eerst in om een e-book te kopen.");
  }

  const item = await getPublicEbookProductBySlug(productSlug);
  if (!item) {
    throw new Error("E-book niet gevonden.");
  }

  await grantDirectEbookPurchase(user.id, item);

  revalidatePath(`/shop/ebooks/${productSlug}`);
  revalidatePath("/account");
}
