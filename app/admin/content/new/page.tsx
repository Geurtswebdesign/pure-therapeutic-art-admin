import { redirect } from "next/navigation";
import { createContentItem } from "@/lib/content/mutations";

export default async function NewContentPage() {
  const item = await createContentItem();
  redirect(`/admin/content/${item.id}`);
}
