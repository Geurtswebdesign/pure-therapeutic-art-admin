// Admin dashboard entry page

import { redirect } from "next/navigation";

export default function AdminPage() {
  // Doorsturen naar users overzicht
  redirect("/admin/users");
}
