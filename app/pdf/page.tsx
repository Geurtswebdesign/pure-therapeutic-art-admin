import { notFound } from "next/navigation";
import PdfViewerScreen from "@/components/content/PdfViewerScreen";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
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

  return <PdfViewerScreen pdfSrc={pdfSrc} language={language} />;
}
