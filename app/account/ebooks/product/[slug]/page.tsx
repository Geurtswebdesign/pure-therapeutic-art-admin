import { notFound, redirect } from "next/navigation";
import PublicAppShell from "@/components/public/PublicAppShell";
import ProtectedReaderShell from "@/components/content/ProtectedReaderShell";
import AccountProductEbookReader from "@/components/account/AccountProductEbookReader";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  getPublicEbookProductBySlug,
  resolveEbookProductState,
} from "@/lib/shop/ebook-products";

export default async function AccountProductEbookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/account");
  }

  const { slug } = await params;
  const item = await getPublicEbookProductBySlug(slug);
  if (!item) {
    notFound();
  }

  const state = await resolveEbookProductState({
    item,
    userId: user.id,
  });

  if (!state.item.epubUrl?.trim() || !state.readerHref || !state.hasAccess) {
    redirect(`/shop/ebooks/${slug}`);
  }

  return (
    <PublicAppShell
      activeTab="profiel"
      title="EBooks"
      subtitle="Veilig lezen in de app"
    >
      <ProtectedReaderShell watermarkText={user.email ?? user.id}>
        <AccountProductEbookReader
          title={state.item.title}
          epubUrl={state.item.epubUrl}
          backHref="/account?panel=ebooks"
        />
      </ProtectedReaderShell>
    </PublicAppShell>
  );
}
