export const EBOOK_STORAGE_BUCKET = "secure-ebooks";

const STORAGE_ROUTE_MARKERS = [
  "/storage/v1/object/public/",
  "/storage/v1/object/sign/",
  "/storage/v1/object/authenticated/",
] as const;

export type EbookAssetReference = {
  bucket: string;
  path: string;
};

export function encodePrivateEbookReference(path: string) {
  return `${EBOOK_STORAGE_BUCKET}:${path.replace(/^\/+/, "")}`;
}

export function parseEbookAssetReference(
  reference: string | null | undefined
): EbookAssetReference | null {
  const trimmed = reference?.trim() ?? "";
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith(`${EBOOK_STORAGE_BUCKET}:`)) {
    return {
      bucket: EBOOK_STORAGE_BUCKET,
      path: trimmed.slice(EBOOK_STORAGE_BUCKET.length + 1),
    };
  }

  if (trimmed.startsWith(`${EBOOK_STORAGE_BUCKET}/`)) {
    return {
      bucket: EBOOK_STORAGE_BUCKET,
      path: trimmed.slice(EBOOK_STORAGE_BUCKET.length + 1),
    };
  }

  if (trimmed.startsWith("media/")) {
    return {
      bucket: "media",
      path: trimmed.slice("media/".length),
    };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const marker = STORAGE_ROUTE_MARKERS.find((candidate) =>
        url.pathname.includes(candidate)
      );

      if (!marker) {
        return null;
      }

      const afterMarker = url.pathname.split(marker)[1] ?? "";
      const segments = afterMarker.split("/").filter(Boolean);
      const [bucket, ...pathParts] = segments;

      if (!bucket || !pathParts.length) {
        return null;
      }

      return {
        bucket,
        path: pathParts.join("/"),
      };
    } catch {
      return null;
    }
  }

  if (trimmed.includes("/")) {
    return {
      bucket: EBOOK_STORAGE_BUCKET,
      path: trimmed.replace(/^\/+/, ""),
    };
  }

  return null;
}

export function hasConfiguredEbookAsset(
  reference: string | null | undefined
) {
  return Boolean(parseEbookAssetReference(reference));
}

export function getEbookReaderHref(productSlug: string) {
  return `/account/ebooks/product/${productSlug}`;
}

export function getEbookReaderFileHref(productSlug: string) {
  return `/api/account/ebooks/${productSlug}/file`;
}
