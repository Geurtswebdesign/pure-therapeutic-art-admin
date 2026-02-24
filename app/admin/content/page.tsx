import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import ContentTableClient from "@/components/content/admin/ContentTableClient";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { getAdminMessages } from "@/lib/i18n/adminMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

type PageProps = {
  searchParams: Promise<{
    s?: string;
    status?: "all" | "draft" | "published";
  }>;
};

export default async function AdminContentPage({ searchParams }: PageProps) {
  const language = resolveUiLanguage(await getPrimaryLanguage());
  const t = getAdminMessages(language).contentPage;

  const supabase = createAdminClient();
  const { s, status } = await searchParams;
  const search = s?.trim() ?? "";
  const statusFilter = status ?? "all";

  let query = supabase
    .from("content_items")
    .select("*")
    .order("updated_at", { ascending: false });

  // 🔍 WP-style search: title + body/content
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,content.ilike.%${search}%`
    );
  }

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: items, error } = await query;

  if (error) {
    throw new Error(t.loadError);
  }

  let allCategories: { id: string; name: string }[] = [];

  const { data: categoryTaxonomy } = await supabase
    .from("content_taxonomies")
    .select("id")
    .eq("slug", "category")
    .maybeSingle();

  if (categoryTaxonomy?.id) {
    const { data: categories } = await supabase
      .from("content_terms")
      .select("id, name")
      .eq("taxonomy_id", categoryTaxonomy.id)
      .order("sort_order", { ascending: true });

    allCategories = categories ?? [];
  }

  return (
    <div className="w-full space-y-4">
      {/* =========================
         Header (WP-style)
         ========================= */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t.title}</h1>

        <Link
          href="/admin/content/new"
          className="rounded bg-[#2271b1] px-4 py-2 text-sm font-medium text-white hover:bg-[#135e96]"
        >
          {t.newPage}
        </Link>
      </div>

      {/* =========================
         Tabel
         ========================= */}
      {/* Header + zoekveld zit in client */}
      <ContentTableClient
        items={items ?? []}
        allCategories={allCategories}
        language={language}
      />
    </div>
  );
}
