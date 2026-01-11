import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function NewContentPage() {
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

  // Veiligheid: alleen admins mogen hier komen
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin =
    user?.app_metadata?.role === "admin" ||
    user?.user_metadata?.role === "admin";

  if (!isAdmin) {
    redirect("/content");
  }

  // Nieuw content item (minimaal)
  const { data, error } = await supabase
    .from("content_items")
    .insert({
      status: "draft",
      type: "article",
      credit_cost: 0,
    })
    .select("id")
    .single();

  if (error || !data) {
    return <pre>ERROR: {error?.message ?? "Kon item niet aanmaken"}</pre>;
  }

  // Direct door naar editor
  redirect(`/content/${data.id}`);
}
