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
    "Veiligheid & privacy",
    "Safety & Privacy",
    "Security & privacy",
    "Sicherheit & Datenschutz",
    "Welkom",
    "Welcome",
    "Willkommen",
    "Disclaimer",
    "Algemene voorwaarden en condities",
    "Privacyverklaring AVG",
    "Impressum",
    "Imperssum",
    "Copyright",
  ].map((value) => value.toLowerCase())
);

const LEGAL_CATEGORY_SLUGS = new Set(
  [
    "veiligheid-privacy",
    "safety-privacy",
    "security-privacy",
    "welkom",
    "welcome",
    "willkommen",
    "disclaimer",
    "algemene-voorwaarden-en-condities",
    "privacyverklaring-avg",
    "impressum",
    "imperssum",
    "copyright",
  ].map((value) => value.toLowerCase())
);

type LegalTermRow = {
  id: string;
  parent_id: string | null;
  name: string | null;
  slug: string | null;
};

function normalizeValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function isLegalTerm(term: LegalTermRow, termsById: Map<string, LegalTermRow>) {
  let current: LegalTermRow | undefined = term;
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);

    const slug = normalizeValue(current.slug);
    const name = normalizeValue(current.name);
    if (
      (slug && LEGAL_CATEGORY_SLUGS.has(slug)) ||
      (name && LEGAL_CATEGORY_NAMES.has(name))
    ) {
      return true;
    }

    current = current.parent_id ? termsById.get(current.parent_id) : undefined;
  }

  return false;
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
      .select("id, parent_id, name, slug");

    if (termsError) {
      throw termsError;
    }

    const termsById = new Map(
      ((terms ?? []) as LegalTermRow[]).map((term) => [term.id, term])
    );

    if (
      termIds.some((termId) => {
        const term = termsById.get(termId);
        return term ? isLegalTerm(term, termsById) : false;
      })
    ) {
      return true;
    }

    categories = ((terms ?? []) as LegalTermRow[])
      .filter((term) => termIds.includes(term.id))
      .map((row) => row.name)
      .filter((value): value is string => Boolean(value));
  }

  return isLegalContentMetadata({
    slug: item.slug,
    title: item.title,
    categories,
  });
}
