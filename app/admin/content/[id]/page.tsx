import ContentEditorClient from "./ContentEditorClient";
import { getContentBlocks, getContentItem } from "@/lib/content/queries";
import { extractAccordionSectionsFromBlocks } from "@/lib/content/accordionSections";
import { parseContentBlocks } from "@/lib/content/renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

export default async function ContentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const uiLanguage = resolveUiLanguage(await getPrimaryLanguage());

  const [item, rawBlocks] = await Promise.all([
    getContentItem(id),
    getContentBlocks(id),
  ]);
  const supabase = createAdminClient();
  const accordionSections = extractAccordionSectionsFromBlocks(
    parseContentBlocks(rawBlocks ?? [])
  );

  const { data: categoryTaxonomy } = await supabase
    .from("content_taxonomies")
    .select("id")
    .eq("slug", "category")
    .maybeSingle();

  const { data: tagTaxonomy } = await supabase
    .from("content_taxonomies")
    .select("id")
    .eq("slug", "tag")
    .maybeSingle();

  let categoryTerms: Array<{
    id: string;
    taxonomy_id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    description: string | null;
    sort_order: number;
    is_active: boolean;
  }> = [];
  let tagTerms: Array<{
    id: string;
    taxonomy_id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    description: string | null;
    sort_order: number;
    is_active: boolean;
  }> = [];

  let selectedCategoryIds: string[] = [];
  let selectedTagIds: string[] = [];
  const { data: relationships } = await supabase
    .from("content_term_relationships")
    .select("term_id")
    .eq("content_item_id", item.id);
  const selectedSet = new Set((relationships ?? []).map((rel) => rel.term_id));

  if (categoryTaxonomy) {
    const { data: terms } = await supabase
      .from("content_terms")
      .select("id,taxonomy_id,parent_id,name,slug,description,sort_order,is_active")
      .eq("taxonomy_id", categoryTaxonomy.id)
      .order("sort_order", { ascending: true });

    categoryTerms = terms ?? [];
    selectedCategoryIds = categoryTerms
      .map((term) => term.id)
      .filter((termId) => selectedSet.has(termId));
  }

  if (tagTaxonomy) {
    const { data: terms } = await supabase
      .from("content_terms")
      .select("id,taxonomy_id,parent_id,name,slug,description,sort_order,is_active")
      .eq("taxonomy_id", tagTaxonomy.id)
      .order("sort_order", { ascending: true });

    tagTerms = terms ?? [];
    selectedTagIds = tagTerms
      .map((term) => term.id)
      .filter((termId) => selectedSet.has(termId));
  }

  return (
    <ContentEditorClient
      uiLanguage={uiLanguage}
      item={item}
      categoryTerms={categoryTerms}
      selectedCategoryIds={selectedCategoryIds}
      tagTerms={tagTerms}
      selectedTagIds={selectedTagIds}
      accordionSections={accordionSections}
    />
  );
}
