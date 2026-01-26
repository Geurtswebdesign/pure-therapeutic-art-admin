import { notFound } from "next/navigation";
import {
  getPublishedContentBySlug,
  getPublishedBlocks,
} from "@/lib/content/public-queries";
import PublicBlockRenderer from "@/components/content/PublicBlockRenderer";
import { normalizeImages } from "@/lib/content/normalizeHtml";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // ⬅️ CRUCIAAL

  const item = await getPublishedContentBySlug(slug);

  if (!item) notFound();

  const blocks = await getPublishedBlocks(item.id);

  return (
  <article className="max-w-3xl mx-auto py-12">
    <h1 className="text-4xl font-semibold mb-6">
      {item.title}
    </h1>

    {/* BODY (classic editor content) */}
    {item.body && (
      <div
        className="prose prose-lg mb-10"
        dangerouslySetInnerHTML={{
          __html: normalizeImages(item.body),
        }}
      />
    )}

    {/* BLOCKS (images, galleries, etc.) */}
    <div className="space-y-8">
      {blocks.map((block) => (
        <PublicBlockRenderer key={block.id} block={block} />
      ))}
    </div>
  </article>
);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // ⬅️ OOK HIER

  const item = await getPublishedContentBySlug(slug);

  if (!item) return {};

  return {
    title: item.title,
    description: item.excerpt ?? "",
    openGraph: {
      title: item.title,
      description: item.excerpt ?? "",
    },
  };
}
