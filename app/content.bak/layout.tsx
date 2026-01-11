import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import AdminChrome from "@/app/_components/admin/AdminChrome";

export default async function ContentLayout({
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
        getAll() {
          return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAdmin =
    user?.app_metadata?.role === "admin" ||
    user?.user_metadata?.role === "admin";

  // Admin: WP-achtige chrome
  if (isAdmin) {
    return <AdminChrome>{children}</AdminChrome>;
  }

  // User: simpele layout
  return <div className="min-h-screen bg-white">{children}</div>;
}
