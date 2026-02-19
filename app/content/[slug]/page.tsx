import { notFound } from "next/navigation";
import Image from "next/image";
import {
  getPublishedContentBySlug,
  getPublishedBlocks,
} from "@/lib/content/public-queries";
import PublicBlockRenderer from "@/components/content/PublicBlockRenderer";
import { normalizeImages } from "@/lib/content/normalizeHtml";
import { hasAccess } from "@/lib/unlock/hasAccess";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import LockedView from "../../../components/content/LockedView";
import { getWalletBalance } from "@/lib/users/getWalletBalance";

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
    const balance = user ? await getWalletBalance(user.id) : 0;

    return (
      <article className="max-w-3xl mx-auto py-12 space-y-6">
        <h1 className="text-4xl font-semibold">{item.title}</h1>

        {item.featured_image_url ? (
          <Image
            src={item.featured_image_url}
            alt={item.featured_image_alt || item.title || "Uitgelichte afbeelding"}
            width={1200}
            height={630}
            unoptimized
            className="w-full h-auto rounded-lg border object-cover"
          />
        ) : null}

        {item.excerpt ? (
          <p className="text-lg text-gray-700 leading-relaxed">{item.excerpt}</p>
        ) : null}

        <LockedView
          contentId={item.id}
          cost={item.credit_cost}
          balance={balance}
        />
      </article>
    );
  }

  const blocks = await getPublishedBlocks(item.id);

  return (
    <article className="max-w-3xl mx-auto py-12">
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

      {item.excerpt ? (
        <p className="text-lg text-gray-700 leading-relaxed mb-6">{item.excerpt}</p>
      ) : null}

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
