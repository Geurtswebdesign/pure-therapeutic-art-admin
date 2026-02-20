import { notFound } from "next/navigation";
import Image from "next/image";
import logo from "@/assets/branding/logo.png";
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
      <div className="lockout-page">
        <article className="lockout-container space-y-5">
          <header className="flex items-start gap-3">
            <Image src={logo} alt="Pure Grief and Therapeutic ART" width={46} height={46} priority />
            <h3 className="lockout-brand-title">
              Pure Grief and Therapeutic ART
            </h3>
          </header>

          <h1 className="lockout-title">
            {item.title}
          </h1>

          {item.featured_image_url ? (
            <Image
              src={item.featured_image_url}
              alt={item.featured_image_alt || item.title || "Uitgelichte afbeelding"}
              width={1200}
              height={630}
              unoptimized
              className="h-auto w-full rounded border object-cover"
            />
          ) : null}

          {item.excerpt ? (
            <p className="lockout-copy">
              {item.excerpt}
            </p>
          ) : null}

          <LockedView
            contentId={item.id}
            cost={item.credit_cost ?? 0}
            balance={balance}
            isLoggedIn={!!user}
          />
        </article>
      </div>
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
