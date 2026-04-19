import { notFound } from "next/navigation";
import HistoryBackButton from "@/components/public/HistoryBackButton";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import { getPublicAppMessages } from "@/lib/i18n/publicAppMessages";
import { resolveUiLanguage } from "@/lib/i18n/runtime";

function isSupportedPdfSource(src: string) {
  return src.startsWith("/") || src.startsWith("http://") || src.startsWith("https://");
}

function getPdfFileName(src: string) {
  try {
    const parsedUrl = src.startsWith("/")
      ? new URL(src, "https://pure-therapeutic-art-therapy.com")
      : new URL(src);
    const fileName = parsedUrl.pathname.split("/").filter(Boolean).pop();
    return fileName ? decodeURIComponent(fileName) : "document.pdf";
  } catch {
    return "document.pdf";
  }
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
  const fileName = getPdfFileName(pdfSrc);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
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

      <section className="rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 border-b border-stone-200 pb-4">
          <h1 className="text-xl font-semibold tracking-tight text-stone-950 sm:text-2xl">
            {fileName}
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {t.inlineHint}
          </p>
        </div>

        <iframe
          src={pdfSrc}
          title={fileName}
          className="min-h-[70vh] w-full rounded-xl border border-stone-200 bg-stone-50"
        />

        <p className="mt-4 text-sm leading-6 text-stone-600">
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
        </p>
      </section>
    </main>
  );
}
