import { redirect } from "next/navigation";
import { getAdminAreaUrl } from "@/lib/site/urls";

export default function CategoriesPage() {
  redirect(getAdminAreaUrl("/content/taxonomies/category/terms"));
}
