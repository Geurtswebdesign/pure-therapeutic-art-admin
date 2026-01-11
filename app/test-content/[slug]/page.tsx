'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function ContentDetailPage() {
  const { slug } = useParams() as { slug: string };

  const [item, setItem] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    supabaseBrowser
      .from("content_feed")
      .select("*")
      .eq("slug", slug)
      .eq("locale", "nl")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setItem(data));
  }, [slug]);

  if (!item) return <p>Laden…</p>;

  const isLocked = !item.is_unlocked && item.credit_cost > 0;

  async function unlock() {
    await supabaseBrowser.rpc("unlock_content_item", {
      p_content_item_id: item.id,
    });

    const { data } = await supabaseBrowser
      .from("content_feed")
      .select("*")
      .eq("slug", slug)
      .eq("locale", "nl")
      .limit(1)
      .maybeSingle();

    setItem(data);
  }

  return (
    <div className="p-6">
      <h1>{item.title}</h1>
      <p>{item.summary}</p>

      {isLocked ? (
        !session ? (
          <Link
            href={`/login?redirect=/content/${slug}`}
            className="text-blue-600 underline"
          >
            Log in om te ontgrendelen
          </Link>
        ) : (
          <button onClick={unlock}>
            Unlock ({item.credit_cost} credit)
          </button>
        )
      ) : (
        <p className="text-green-600 mt-4">🔓 Ontgrendeld</p>
      )}
    </div>
  );
}
