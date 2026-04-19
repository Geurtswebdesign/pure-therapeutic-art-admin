const IN_APP_PDF_VIEWER_PATH = "/pdf";
const PDF_VIEWER_SOURCE_PARAM = "src";

function decodeHtmlHref(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

export function isPdfHref(href: string) {
  const normalizedHref = href.trim().toLowerCase();

  if (!normalizedHref) return false;
  if (
    normalizedHref.startsWith("#") ||
    normalizedHref.startsWith("mailto:") ||
    normalizedHref.startsWith("tel:") ||
    normalizedHref.startsWith("javascript:")
  ) {
    return false;
  }

  if (normalizedHref.startsWith(`${IN_APP_PDF_VIEWER_PATH}?`)) {
    return false;
  }

  return /\.pdf(?:$|[?#])/i.test(normalizedHref);
}

export function extractPdfSourceFromViewerHref(href: string) {
  if (!href.startsWith(`${IN_APP_PDF_VIEWER_PATH}?`)) {
    return null;
  }

  const queryString = href.slice(IN_APP_PDF_VIEWER_PATH.length + 1);
  const params = new URLSearchParams(queryString);
  const src = params.get(PDF_VIEWER_SOURCE_PARAM)?.trim();
  return src || null;
}

export function buildInAppPdfViewerHref(href: string) {
  const params = new URLSearchParams({ [PDF_VIEWER_SOURCE_PARAM]: href });
  return `${IN_APP_PDF_VIEWER_PATH}?${params.toString()}`;
}

export function extractFirstPdfSourceFromHtml(html: string | null | undefined) {
  if (!html) {
    return null;
  }

  const hrefPattern = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi;

  for (const match of html.matchAll(hrefPattern)) {
    const rawHref = decodeHtmlHref(match[2] ?? "").trim();
    if (!rawHref) {
      continue;
    }

    const viewerSource = extractPdfSourceFromViewerHref(rawHref);
    if (viewerSource) {
      return viewerSource;
    }

    if (isPdfHref(rawHref)) {
      return rawHref;
    }
  }

  return null;
}
