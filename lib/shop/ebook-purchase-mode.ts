export type EbookPurchaseMode = "disabled" | "direct_grant";

export function getEbookPurchaseMode(): EbookPurchaseMode {
  return process.env.EBOOK_PURCHASE_MODE === "direct_grant"
    ? "direct_grant"
    : "disabled";
}
