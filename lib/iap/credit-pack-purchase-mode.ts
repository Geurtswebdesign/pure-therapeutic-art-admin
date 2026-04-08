export type CreditPackPurchaseMode = "disabled" | "native_store";

export function getCreditPackPurchaseMode(): CreditPackPurchaseMode {
  return process.env.CREDIT_PACK_PURCHASE_MODE === "native_store"
    ? "native_store"
    : "disabled";
}
