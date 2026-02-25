import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/supabase/admin";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import LogoutButton from "@/components/admin/LogoutButton";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // 🔐 Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 🔐 Role check
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/unauthorized");
  }

  const primaryLanguage = await getPrimaryLanguage();

  return (
    <div className="flex min-h-screen bg-[#f0f0f1]">
      <AdminSidebar language={primaryLanguage} />

      <div className="flex flex-col flex-1">
        <AdminTopbar actions={<LogoutButton />} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
