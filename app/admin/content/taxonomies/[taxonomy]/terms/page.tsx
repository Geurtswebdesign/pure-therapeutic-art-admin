import { createAdminClient } from "@/lib/supabase/admin";
import TermsClient from "@/components/taxonomy/TermsClient";

type Props = {
  params: Promise<{ taxonomy: string }>;
};

export default async function TermsPage(props: Props) {
  const { taxonomy } = await props.params;
  const supabase = createAdminClient();

  const { data: tax } = await supabase
    .from("content_taxonomies")
    .select("*")
    .eq("slug", taxonomy)
    .single();

  if (!tax) return <div>Taxonomy not found</div>;

  const { data: termsWithDates, error: termsError } = await supabase
    .from("content_terms")
    .select(`
      *,
      content_term_relationships(count)
    `)
    .eq("taxonomy_id", tax.id)
    .order("sort_order", { ascending: true });

  let terms = termsWithDates;

  if (termsError?.code === "42703") {
    const { data: fallbackTerms, error: fallbackError } = await supabase
      .from("content_terms")
      .select(`
        id,
        taxonomy_id,
        parent_id,
        is_homepage_seed,
        homepage_sort_order,
        name,
        slug,
        description,
        featured_image_url,
        featured_image_alt,
        sort_order,
        is_active,
        content_term_relationships(count)
      `)
      .eq("taxonomy_id", tax.id)
      .order("sort_order", { ascending: true });

    if (fallbackError) {
      throw fallbackError;
    }

    terms = (fallbackTerms ?? []).map((term) => ({
      ...term,
      created_at: null,
      updated_at: null,
    }));
  } else if (termsError) {
    throw termsError;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">
        {tax.name}
      </h1>

      <TermsClient
        taxonomy={tax}
        terms={terms || []}
      />
    </div>
  );
}
