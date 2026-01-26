import ContentEditorClient from "./ContentEditorClient";
import {
  getContentItem,
  getContentBlocks,
} from "@/lib/content/queries";

export default async function ContentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await getContentItem(id);
  const blocks = await getContentBlocks(id);

  return (
    <ContentEditorClient item={item} blocks={blocks} />
  );
}
