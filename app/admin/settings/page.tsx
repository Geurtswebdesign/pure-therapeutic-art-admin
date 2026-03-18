import { redirect } from "next/navigation";
import { getAdminAreaUrl } from "@/lib/site/urls";

export default function SettingsIndexPage() {
  redirect(getAdminAreaUrl("/settings/general"));
}
