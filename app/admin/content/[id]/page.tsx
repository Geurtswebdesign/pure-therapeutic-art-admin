import ContentEditorClient from "./ContentEditorClient";
import { getContentItem } from "@/lib/content/queries";
import TermSelector from "@/components/content/TermSelector";

export default async function ContentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await getContentItem(id);
  return (
    <div className="space-y-6">
      <ContentEditorClient item={item} />
      <TermSelector contentId={item.id} taxonomySlug="category" />
    </div>
  );
}
