import Link from "next/link";
import { notFound } from "next/navigation";
import PublicAppShell from "@/components/public/PublicAppShell";
import { getLegalDocuments } from "@/lib/account/legal-documents";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

type SecurityDocumentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function SecurityDocumentPage({
  params,
}: SecurityDocumentPageProps) {
  const language = resolveUiLanguage(await getAppLanguage());
  const { slug } = await params;
  const documents = await getLegalDocuments(language);
  const document = documents.find((item) => item.slug === slug);

  if (!document) {
    notFound();
  }

  const backLabel =
    language === "en"
      ? "Back to security & privacy"
      : language === "de"
        ? "Zuruck zu Sicherheit & Datenschutz"
        : "Terug naar Veiligheid & privacy";

  return (
    <PublicAppShell activeTab="profiel">
      <section className="space-y-4">
        <div className="rounded-[1.5rem] border border-[#e5dbcf] bg-[#f7f0e9] p-4">
          <Link
            href="/account?panel=security"
            className="inline-flex rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800"
          >
            {backLabel}
          </Link>

          <div className="mt-4 rounded-2xl border border-[#e5dbcf] bg-white px-5 py-5">
            <h1 className="font-serif text-3xl text-stone-950">
              {document.title}
            </h1>
            <p className="mt-4 text-sm leading-7 text-stone-700">
              {document.body}
            </p>
          </div>
        </div>
      </section>
    </PublicAppShell>
  );
}
