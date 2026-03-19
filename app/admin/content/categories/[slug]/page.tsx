import { redirect } from "next/navigation";
import { getAdminAreaUrl } from "@/lib/site/urls";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EditCategoryPage(props: Props) {
  const { slug } = await props.params;
  redirect(getAdminAreaUrl(`/content/taxonomies/category/terms/${slug}`));
}
