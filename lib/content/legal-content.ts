import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const LEGAL_CONTENT_SLUGS = new Set(
  [
    "disclaimer",
    "algemene-voorwaarden-en-condities",
    "privacyverklaring-avg",
    "impressum",
    "imperssum",
    "copyright",
  ].map((value) => value.toLowerCase())
);

const LEGAL_CONTENT_TITLES = new Set(
  [
    "Disclaimer",
    "Algemene voorwaarden en condities",
    "Privacyverklaring AVG",
    "Impressum",
    "Imperssum",
    "Copyright",
    "copyright",
  ].map((value) => value.toLowerCase())
);

const LEGAL_CATEGORY_NAMES = new Set(
  [
    "Disclaimer",
    "Algemene voorwaarden en condities",
    "Privacyverklaring AVG",
    "Impressum",
    "Imperssum",
    "Copyright",
  ].map((value) => value.toLowerCase())
);

function normalizeValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function isLegalContentMetadata(input: {
  slug?: string | null;
  title?: string | null;
  categories?: Array<string | null | undefined>;
}) {
  const normalizedSlug = normalizeValue(input.slug);
  if (normalizedSlug && LEGAL_CONTENT_SLUGS.has(normalizedSlug)) {
    return true;
  }

  const normalizedTitle = normalizeValue(input.title);
  if (normalizedTitle && LEGAL_CONTENT_TITLES.has(normalizedTitle)) {
    return true;
  }

  return (input.categories ?? []).some((category) =>
    LEGAL_CATEGORY_NAMES.has(normalizeValue(category))
  );
}

export async function isLegalContentItem(contentItemId: string) {
  const supabase = createAdminClient();

  const { data: item, error: itemError } = await supabase
    .from("content_items")
    .select("slug, title")
    .eq("id", contentItemId)
    .maybeSingle<{ slug: string | null; title: string | null }>();

  if (itemError) {
    throw itemError;
  }

  if (!item) {
    return false;
  }

  const { data: relationships, error: relationshipsError } = await supabase
    .from("content_term_relationships")
    .select("term_id")
    .eq("content_item_id", contentItemId);

  if (relationshipsError) {
    throw relationshipsError;
  }

  const termIds = (relationships ?? [])
    .map((row) => row.term_id)
    .filter((value): value is string => Boolean(value));

  let categories: string[] = [];

  if (termIds.length) {
    const { data: terms, error: termsError } = await supabase
      .from("content_terms")
      .select("name")
      .in("id", termIds);

    if (termsError) {
      throw termsError;
    }

    categories = (terms ?? [])
      .map((row) => row.name)
      .filter((value): value is string => Boolean(value));
  }

  return isLegalContentMetadata({
    slug: item.slug,
    title: item.title,
    categories,
  });
}
