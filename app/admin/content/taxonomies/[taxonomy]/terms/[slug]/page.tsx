import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import EditTermForm from "@/components/taxonomy/EditTermForm";

type Props = {
  params: Promise<{ taxonomy: string; slug: string }>;
};

export default async function EditTermPage(props: Props) {
  const { taxonomy, slug } = await props.params;
  const supabase = createAdminClient();

  const { data: tax } = await supabase
    .from("content_taxonomies")
    .select("*")
    .eq("slug", taxonomy)
    .single();

  if (!tax) return notFound();

  const { data: term } = await supabase
    .from("content_terms")
    .select("*")
    .eq("taxonomy_id", tax.id)
    .eq("slug", slug)
    .single();

  if (!term) return notFound();

  const { data: allTerms } = await supabase
    .from("content_terms")
    .select("id,name,parent_id")
    .eq("taxonomy_id", tax.id)
    .order("name");

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit Term</h1>
      <EditTermForm taxonomy={tax} term={term} allTerms={allTerms || []} />
    </div>
  );
}
