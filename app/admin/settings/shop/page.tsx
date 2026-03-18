import { redirect } from "next/navigation";
import { getAdminAreaUrl } from "@/lib/site/urls";

export default function SettingsShopPage() {
  redirect(getAdminAreaUrl("/shop"));
}
