import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import AdminEditor from "./_components/AdminEditor";
import UserViewer from "./_components/UserViewer";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ params is async in Next 15
  const { id } = await params;

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore
            .getAll()
            .map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin =
    user?.app_metadata?.role === "admin" ||
    user?.user_metadata?.role === "admin";

  const { data: item, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !item) {
    return <p>Content niet gevonden</p>;
  }

  const { data: translations } = await supabase
    .from("content_translations")
    .select("*")
    .eq("content_id", item.id)
    .order("locale");

  return isAdmin ? (
    <AdminEditor item={item} translations={translations ?? []} />
  ) : (
    <UserViewer item={item} translations={translations ?? []} />
  );
}
