export const CONTENT_ITEM_TYPES = ["article", "pdf"] as const;

export type ContentItemType = (typeof CONTENT_ITEM_TYPES)[number];

export function normalizeContentItemType(
  value: string | null | undefined
): ContentItemType {
  return value === "pdf" ? "pdf" : "article";
}

export function isPdfContentItem(
  value: string | null | undefined
): value is "pdf" {
  return normalizeContentItemType(value) === "pdf";
}
