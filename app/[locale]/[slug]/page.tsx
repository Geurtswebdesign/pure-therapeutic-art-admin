// Public localized content page renderer
// Supports published content + admin-only preview mode (Optie A)

import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Image from "next/image";

import ContentLayout from "@/components/content/ContentLayout";
import PublicBlockRenderer from "@/components/content/PublicBlockRenderer";
import ContentLockout from "@/components/content/ContentLockout";
import { parseContentBlocks } from "@/lib/content/renderer";
import { normalizeImages } from "@/lib/content/normalizeHtml";
import { hasAccess } from "@/lib/unlock/hasAccess";
import { getBalanceByScope } from "@/lib/users/getBalanceByScope";
import { getContentAccessScope } from "@/lib/content/access";

type PageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
  searchParams: Promise<{
    preview?: string;
  }>;
};

export default async function ContentPage({
  params,
  searchParams,
}: PageProps) {
  const { locale, slug } = await params;
  const { preview } = await searchParams;

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  /* -------------------------------------------------
   * 1️⃣ Check gebruiker + preview permissie
   * ------------------------------------------------- */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin =
    user?.app_metadata?.role === "admin" ||
    user?.user_metadata?.role === "admin";

  const isPreview = preview === "1" && isAdmin;

  /* -------------------------------------------------
   * 2️⃣ Content item ophalen (incl. body)
   * ------------------------------------------------- */
  const { data: item, error: itemError } = await supabase
    .from("content_items")
    .select("id, title, body, status, language, credit_cost, excerpt, featured_image_url, featured_image_alt")
    .eq("slug", slug)
    .eq("language", locale)
    .single();

  if (!item || itemError) {
    notFound();
  }

  /* -------------------------------------------------
   * 3️⃣ Status check
   * ------------------------------------------------- */
  // Publiek → alleen published
  if (!isPreview && item.status !== "published") {
    notFound();
  }

  // Preview → draft + published
  if (isPreview && !["draft", "published"].includes(item.status)) {
    notFound();
  }

  /* -------------------------------------------------
   * 3b️⃣ Unlock check (alleen buiten admin-preview)
   * ------------------------------------------------- */
  const requiresUnlock = (item.credit_cost ?? 0) > 0;
  const scope = await getContentAccessScope(item.id);
  let hasUserAccess = false;

  if (!isPreview && requiresUnlock && user) {
    hasUserAccess = await hasAccess(user.id, item.id);
  }

  if (!isPreview && requiresUnlock && !hasUserAccess) {
    const balance = user ? await getBalanceByScope(user.id, scope) : 0;

    return (
      <ContentLayout isPreview={isPreview}>
        <ContentLockout
          item={item}
          balance={balance}
          scope={scope}
          isLoggedIn={!!user}
        />
      </ContentLayout>
    );
  }

  /* -------------------------------------------------
   * 4️⃣ Blocks ophalen
   * ------------------------------------------------- */
  const { data: rawBlocks } = await supabase
    .from("content_blocks")
    .select("type, data, order_index")
    .eq("content_item_id", item.id)
    .order("order_index");

  const blocks = parseContentBlocks(rawBlocks ?? []);

  /* -------------------------------------------------
   * 5️⃣ Render (IDENTIEK aan live)
   * ------------------------------------------------- */
  return (
  <ContentLayout isPreview={isPreview}>
    <article>
      <h1 className="text-4xl font-semibold mb-6">
        {item.title}
      </h1>

      {item.featured_image_url ? (
        <Image
          src={item.featured_image_url}
          alt={item.featured_image_alt || item.title || "Uitgelichte afbeelding"}
          width={1200}
          height={630}
          unoptimized
          className="w-full h-auto rounded-lg border object-cover mb-6"
        />
      ) : null}

      {/* BODY */}
      {item.body && (
        <div
          className="prose prose-lg mb-10"
          dangerouslySetInnerHTML={{
            __html: normalizeImages(item.body),
          }}
        />
      )}

      {/* BLOCKS */}
      {blocks.length > 0 && (
        <div className="space-y-8">
          <PublicBlockRenderer blocks={blocks} />
        </div>
      )}
    </article>
  </ContentLayout>
);
}
