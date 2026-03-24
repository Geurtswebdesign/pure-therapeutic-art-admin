export type EbookPurchaseMode = "disabled" | "direct_grant" | "native_store";

export function getEbookPurchaseMode(): EbookPurchaseMode {
  if (process.env.EBOOK_PURCHASE_MODE === "native_store") {
    return "native_store";
  }

  return process.env.EBOOK_PURCHASE_MODE === "direct_grant"
    ? "direct_grant"
    : "disabled";
}
