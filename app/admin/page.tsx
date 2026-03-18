// Admin dashboard entry page

import { redirect } from "next/navigation";
import { getAdminAreaUrl } from "@/lib/site/urls";

export default function AdminPage() {
  redirect(getAdminAreaUrl("/dashboard"));
}
