import { redirect } from "next/navigation";
import { createContentItem } from "@/lib/content/mutations";
import { getAdminAreaUrl } from "@/lib/site/urls";

export default async function NewContentPage() {
  const item = await createContentItem();
  redirect(getAdminAreaUrl(`/content/${item.id}`));
}
