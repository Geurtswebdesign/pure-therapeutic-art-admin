import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function ContentPage() {
  // ✅ cookies() is async in Next 15
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Supabase verwacht getAll()
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

  const { data: items, error } = await supabase
    .from("content_items")
    .select("id, slug, type, status, credit_cost, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return <pre>ERROR: {error.message}</pre>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        {isAdmin ? "Contentbeheer" : "Content"}
      </h1>
        {isAdmin && (
  <div className="mb-4 flex justify-end">
    <a
      href="/content/new"
      className="bg-[#2271b1] hover:bg-[#135e96] text-white px-4 py-2 rounded"
    >
      Add New
    </a>
  </div>
)}

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-3 py-2 text-left">Slug</th>
            <th className="border px-3 py-2">Type</th>
            {isAdmin && (
              <>
                <th className="border px-3 py-2">Status</th>
                <th className="border px-3 py-2">Credits</th>
              </>
            )}
            <th className="border px-3 py-2">Actie</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((item) => (
            <tr key={item.id}>
              <td className="border px-3 py-2">
                <code>{item.slug}</code>
              </td>
              <td className="border px-3 py-2">{item.type}</td>

              {isAdmin && (
                <>
                  <td className="border px-3 py-2">{item.status}</td>
                  <td className="border px-3 py-2 text-center">
                    {item.credit_cost ?? "—"}
                  </td>
                </>
              )}

              <td className="border px-3 py-2">
                <Link
                  href={`/content/${item.id}`}
                  className="text-blue-600 underline"
                >
                  {isAdmin ? "Bewerken" : "Bekijken"}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
