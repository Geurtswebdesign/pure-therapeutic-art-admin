import { normalizeImages } from "@/lib/content/normalizeHtml";

type Props = {
  html: string;
  className?: string;
};

export default function RichTextExcerpt({ html, className }: Props) {
  const normalized = normalizeImages(html);

  return <div className={className} dangerouslySetInnerHTML={{ __html: normalized }} />;
}
