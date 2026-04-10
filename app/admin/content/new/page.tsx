import NewContentEditorClient from "./NewContentEditorClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getSupportedLanguageOptions } from "@/lib/i18n/settings";

export default async function NewContentPage() {
  const primaryLanguage = await getPrimaryLanguage();
  const uiLanguage = resolveUiLanguage(primaryLanguage);
  const languageOptions = await getSupportedLanguageOptions(uiLanguage);
  const supabase = createAdminClient();

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

  if (categoryTaxonomy) {
    const { data: terms } = await supabase
      .from("content_terms")
      .select("id,taxonomy_id,parent_id,name,slug,description,sort_order,is_active")
      .eq("taxonomy_id", categoryTaxonomy.id)
      .order("sort_order", { ascending: true });

    categoryTerms = terms ?? [];
  }

  if (tagTaxonomy) {
    const { data: terms } = await supabase
      .from("content_terms")
      .select("id,taxonomy_id,parent_id,name,slug,description,sort_order,is_active")
      .eq("taxonomy_id", tagTaxonomy.id)
      .order("sort_order", { ascending: true });

    tagTerms = terms ?? [];
  }

  return (
    <NewContentEditorClient
      uiLanguage={uiLanguage}
      initialLanguage={primaryLanguage}
      categoryTerms={categoryTerms}
      tagTerms={tagTerms}
      languageOptions={languageOptions}
    />
  );
}
