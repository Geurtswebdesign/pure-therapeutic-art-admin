import { notFound } from "next/navigation";
import {
  getPublishedContentBySlug,
  getPublishedBlocks,
} from "@/lib/content/public-queries";
import PublicBlockRenderer from "@/components/content/PublicBlockRenderer";
import { normalizeImages } from "@/lib/content/normalizeHtml";
import { hasAccess } from "@/lib/unlock/hasAccess";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import LockedView from "../../../components/content/LockedView";


export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const item = await getPublishedContentBySlug(slug);
  if (!item) notFound();

  const user = await getCurrentUser();

  const requiresUnlock = item.credit_cost > 0;

  let hasUserAccess = false;

  if (requiresUnlock && user) {
    hasUserAccess = await hasAccess(user.id, item.id);
  }

  if (requiresUnlock && !hasUserAccess) {
    return (
      <LockedView
        contentId={item.id}
        cost={item.credit_cost}
      />
    );
  }

  const blocks = await getPublishedBlocks(item.id);

  return (
    <article className="max-w-3xl mx-auto py-12">
      <h1 className="text-4xl font-semibold mb-6">
        {item.title}
      </h1>

      {item.body && (
        <div
          className="prose prose-lg mb-10"
          dangerouslySetInnerHTML={{
            __html: normalizeImages(item.body),
          }}
        />
      )}

      <div className="space-y-8">
        <PublicBlockRenderer blocks={blocks} />
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
