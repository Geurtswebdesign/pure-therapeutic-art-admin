import { notFound } from "next/navigation";
import PdfDocumentViewer from "@/components/content/PdfDocumentViewer";
import HistoryBackButton from "@/components/public/HistoryBackButton";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import { getPublicAppMessages } from "@/lib/i18n/publicAppMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

function isSupportedPdfSource(src: string) {
  return src.startsWith("/") || src.startsWith("http://") || src.startsWith("https://");
}

export default async function PdfViewerPage({
  searchParams,
}: {
  searchParams: Promise<{ src?: string }>;
}) {
  const { src } = await searchParams;
  const pdfSrc = src?.trim() ?? "";

  if (!pdfSrc || !isSupportedPdfSource(pdfSrc)) {
    notFound();
  }

  const language = resolveUiLanguage(await getAppLanguage());
  const t = getPublicAppMessages(language).pdfViewer;

  return (
    <main className="h-[100svh] h-[100dvh] overflow-y-auto bg-[linear-gradient(180deg,#f3e4d9_0%,#efe5dc_26%,#f7f2ec_64%,#f9f7f3_100%)] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] pt-[calc(env(safe-area-inset-top,0px)+1rem)] sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 bg-[linear-gradient(180deg,rgba(243,228,217,0.98)_0%,rgba(247,242,236,0.94)_100%)] px-1 py-2 backdrop-blur-sm">
          <HistoryBackButton
            fallbackHref="/content"
            className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800"
          >
            {t.back}
          </HistoryBackButton>
          <a
            href={pdfSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800"
          >
            {t.openExternal}
          </a>
        </div>

        <section className="space-y-4 rounded-[1.5rem] border border-stone-200 bg-[#f9f5ef] p-3 shadow-sm sm:p-4">
          <PdfDocumentViewer
            src={pdfSrc}
            loadingLabel={t.loading}
            errorLabel={t.loadError}
          />

          <div className="text-center text-sm leading-6 text-stone-600">
            {t.fallbackPrefix}{" "}
            <a
              href={pdfSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-stone-900 underline"
            >
              {t.fallbackLink}
            </a>
            .
          </div>
        </section>
      </div>
    </main>
  );
}
