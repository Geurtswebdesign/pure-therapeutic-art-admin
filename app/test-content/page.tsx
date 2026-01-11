'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

type ContentItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  credit_cost: number;
  is_unlocked: boolean;
};

export default function TestContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    supabaseBrowser
      .from("content_feed")
      .select("*")
      .eq("locale", "nl")
      .then(({ data }) => setItems(data ?? []));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl mb-4">Content</h1>

      {items.map(item => {
        const isLocked = !item.is_unlocked && item.credit_cost > 0;

        const href =
          isLocked && !session
            ? `/login?redirect=/content/${item.slug}`
            : `/content/${item.slug}`;

        const label =
          isLocked && !session
            ? "🔐 Inloggen om te unlocken"
            : isLocked
            ? "🔓 Unlock met credits"
            : "👁️ Bekijken";

        return (
          <div key={item.id} className="border p-4 mb-3 rounded">
            <strong>{item.title}</strong>
            <p>{item.summary}</p>

            <Link
              href={href}
              className="inline-block mt-2 px-3 py-1 rounded border"
            >
              {label}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
