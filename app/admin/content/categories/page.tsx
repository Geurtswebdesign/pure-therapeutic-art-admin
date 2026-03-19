// app/admin/categories/page.tsx

import { createAdminClient } from "@/lib/supabase/admin";
import CategoryTable from "@/components/categories/CategoryTable";
import CategoryForm from "@/components/categories/CategoryForm";
import type { Category } from "@/components/categories/CategoryTree";

export default async function CategoriesPage() {
  const supabase = createAdminClient();
  const { data: categoryTaxonomy, error: taxonomyError } = await supabase
    .from("content_taxonomies")
    .select("id")
    .eq("slug", "category")
    .maybeSingle();

  if (taxonomyError) {
    console.error("CATEGORY TAXONOMY FETCH ERROR:", taxonomyError);
  }

  const categoryTaxonomyId = categoryTaxonomy?.id ?? null;

  let data: Category[] | null = null;
  let error: { message: string } | null = null;

  if (categoryTaxonomyId) {
    const result = await supabase
      .from("content_terms")
      .select(`
        id,
        name,
        slug,
        description,
        parent_id,
        sort_order,
        is_active
      `)
      .eq("taxonomy_id", categoryTaxonomyId)
      .order("sort_order", { ascending: true });

    data = result.data as Category[] | null;
    error = result.error;
  }

  if (error) {
    console.error("CATEGORY FETCH ERROR:", error);
  }

  const categories: Category[] = data || [];

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          Categories
        </h1>
        <p className="text-muted-foreground">
          Manage hierarchical content categories.
        </p>
      </div>

      {/* Layout zoals WordPress */}
      <div className="grid grid-cols-3 gap-8">

        {/* Links: Add Form */}
        <div>
          <CategoryForm taxonomyId={categoryTaxonomyId} />
        </div>

        {/* Rechts: Table */}
        <div className="col-span-2">
          <CategoryTable categories={categories} />
        </div>

      </div>
    </div>
  );
}
