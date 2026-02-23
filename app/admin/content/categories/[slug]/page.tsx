import { createAdminClient } from "@/lib/supabase/admin";
import EditCategoryForm from "@/components/categories/EditCategoryForm";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EditCategoryPage(
  props: Props
) {
  const { slug } = await props.params;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("content_categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return notFound();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">
        Categorie bewerken
      </h1>

      <EditCategoryForm category={data} />
    </div>
  );
}
