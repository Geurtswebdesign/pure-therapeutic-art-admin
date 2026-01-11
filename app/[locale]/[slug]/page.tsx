import { notFound } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import BlockRenderer from "@/app/_components/BlockRenderer";

type PageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export default async function ContentPage({ params }: PageProps) {
  const { locale, slug } = await params;
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

  // 1. Probeer content in gevraagde taal
  let { data, error } = await supabase
    .from("content_translations")
    .select(
      `
      title,
      excerpt,
      blocks,
      locale,
      content:contents (
        status
      )
    `
    )
    .eq("slug", slug)
    .eq("locale", locale)
    .eq("status", "published")
    .single();

  // 2. Fallback naar NL
  if (!data) {
    const fallback = await supabase
      .from("content_translations")
      .select(
        `
        title,
        excerpt,
        blocks,
        locale,
        content:contents (
          status
        )
      `
      )
      .eq("slug", slug)
      .eq("locale", "nl")
      .eq("status", "published")
      .single();

    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data || data.content?.status !== "published") {
    notFound();
  }

  return (
    <main className="content">
      <article>
        <h1>{data.title}</h1>

        <BlockRenderer blocks={data.blocks ?? []} />
      </article>
    </main>
  );
}
