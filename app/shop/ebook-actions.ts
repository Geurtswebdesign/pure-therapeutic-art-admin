"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncWebsiteOrderItems } from "@/lib/account/website-orders";
import {
  getEbookReaderHref,
  getEbookUnlockCost,
  getPublicEbookProductBySlug,
  getLinkedContentForEbookProduct,
  getOwnedEbookProductRow,
  userOwnsEbookProduct,
} from "@/lib/shop/ebook-products";
import { getCatalogItemPath, isCatalogItemInDevelopment } from "@/lib/shop/catalog";

type BookScopeWalletRow = {
  credits_available: number;
};

async function rollbackBookCredits(input: {
  userId: string;
  previousBalance: number;
  cost: number;
  refId: string;
}) {
  const supabase = createAdminClient();

  await supabase
    .from("user_credit_scopes")
    .update({
      credits_available: input.previousBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", input.userId)
    .eq("credit_scope", "book");

  await supabase.from("credit_scope_transactions").insert({
    user_id: input.userId,
    credit_scope: "book",
    delta: input.cost,
    balance_after: input.previousBalance,
    reason: "ebook_unlock_rollback",
    ref_id: input.refId,
  });
}

export async function unlockEbookProduct(productSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Log eerst in om dit e-book vrij te spelen.");
  }

  const item = await getPublicEbookProductBySlug(productSlug);
  if (!item || isCatalogItemInDevelopment(item)) {
    throw new Error("Dit e-book is nog niet beschikbaar.");
  }

  const linkedContent = await getLinkedContentForEbookProduct(item);
  const readerHref = getEbookReaderHref(item, linkedContent);

  if (!readerHref) {
    throw new Error("Dit e-book is nog niet gekoppeld aan een leesbare publicatie.");
  }

  const alreadyOwned = await userOwnsEbookProduct({
    userId: user.id,
    item,
    linkedContent,
  });

  if (alreadyOwned) {
    return { readerHref };
  }

  const cost = getEbookUnlockCost(linkedContent);
  if (cost > 0) {
    const admin = createAdminClient();
    const { data: wallet, error: walletError } = await admin
      .from("user_credit_scopes")
      .select("credits_available")
      .eq("user_id", user.id)
      .eq("credit_scope", "book")
      .maybeSingle<BookScopeWalletRow>();

    if (walletError) {
      throw new Error("Boekcredits ophalen mislukt.");
    }

    const previousBalance = wallet?.credits_available ?? 0;
    if (previousBalance < cost) {
      throw new Error("Je hebt niet genoeg boekcredits.");
    }

    const nextBalance = previousBalance - cost;
    const { error: updateError } = await admin
      .from("user_credit_scopes")
      .update({
        credits_available: nextBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("credit_scope", "book");

    if (updateError) {
      throw new Error("Boekcredits afboeken mislukt.");
    }

    const { error: transactionError } = await admin
      .from("credit_scope_transactions")
      .insert({
        user_id: user.id,
        credit_scope: "book",
        delta: -cost,
        balance_after: nextBalance,
        reason: "ebook_unlock",
        ref_id: item.id,
      });

    if (transactionError) {
      await rollbackBookCredits({
        userId: user.id,
        previousBalance,
        cost,
        refId: item.id,
      });
      throw new Error("Boekcredits afboeken mislukt.");
    }

    try {
      const existingRow = await getOwnedEbookProductRow(user.id, item);
      const externalOrderId = `app-ebook-${user.id}`;
      const externalLineId = existingRow ? item.id : item.id;

      await syncWebsiteOrderItems({
        source: "app",
        items: [
          {
            externalOrderId,
            externalLineId,
            userId: user.id,
            customerEmail: user.email ?? null,
            kind: "ebook",
            title: item.title,
            subtitle: item.description || null,
            amountCents: Math.round(item.price * 100),
            currency: "EUR",
            occurredAt: new Date().toISOString(),
            href: readerHref,
            contentItemId: linkedContent?.id ?? null,
            metadata: {
              product_id: item.id,
              product_slug: item.id,
              product_url: getCatalogItemPath(item),
              epub_url: item.epubUrl ?? null,
              quantity: 1,
              order_status: "completed",
              credits_spent: cost,
            },
          },
        ],
      });
    } catch (error) {
      await rollbackBookCredits({
        userId: user.id,
        previousBalance,
        cost,
        refId: item.id,
      });
      throw error instanceof Error
        ? error
        : new Error("E-book vrijspelen mislukt.");
    }
  } else {
    await syncWebsiteOrderItems({
      source: "app",
      items: [
        {
          externalOrderId: `app-ebook-${user.id}`,
          externalLineId: item.id,
          userId: user.id,
          customerEmail: user.email ?? null,
          kind: "ebook",
          title: item.title,
          subtitle: item.description || null,
          amountCents: Math.round(item.price * 100),
          currency: "EUR",
          occurredAt: new Date().toISOString(),
          href: readerHref,
          contentItemId: linkedContent?.id ?? null,
          metadata: {
            product_id: item.id,
            product_slug: item.id,
            product_url: getCatalogItemPath(item),
            epub_url: item.epubUrl ?? null,
            quantity: 1,
            order_status: "completed",
            credits_spent: 0,
          },
        },
      ],
    });
  }

  revalidatePath("/account");
  revalidatePath("/account?panel=ebooks");
  revalidatePath(`/shop/ebooks/${item.id}`);

  return { readerHref };
}
