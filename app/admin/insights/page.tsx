import { redirect } from "next/navigation";
import { getAdminAreaUrl } from "@/lib/site/urls";

export default async function InsightsPage() {
  redirect(getAdminAreaUrl("/insights/traffic/overview"));
}
