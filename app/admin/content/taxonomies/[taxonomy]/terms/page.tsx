import { createAdminClient } from "@/lib/supabase-admin";
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

  const { data: terms } = await supabase
    .from("content_terms")
    .select(`
      *,
      content_term_relationships(count)
    `)
    .eq("taxonomy_id", tax.id)
    .order("sort_order", { ascending: true });

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
