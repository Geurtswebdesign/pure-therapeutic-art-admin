import Link from "next/link";
import { createAdminClient } from "@/lib/supabase-admin";
import ContentTableClient from "@/components/content/admin/ContentTableClient";

type PageProps = {
  searchParams: Promise<{
    s?: string;
    status?: "all" | "draft" | "published";
  }>;
};

export default async function AdminContentPage({ searchParams }: PageProps) {
  const supabase = createAdminClient();
  const { s, status } = await searchParams;
  const search = s?.trim() ?? "";

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

  const { data: items, error } = await query;

  if (error) {
    throw new Error("Content laden mislukt");
  }

  return (
    <div className="w-full space-y-4">
      {/* =========================
         Header (WP-style)
         ========================= */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Content</h1>

        <Link
          href="/admin/content/new"
          className="rounded bg-[#2271b1] px-4 py-2 text-sm font-medium text-white hover:bg-[#135e96]"
        >
          Nieuwe pagina
        </Link>
      </div>

      {/* =========================
         Tabel
         ========================= */}
      {/* Header + zoekveld zit in client */}
      <ContentTableClient
        items={items ?? []}
      />
    </div>
  );
}
