"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/browser";

type MediaAsset = {
  id: string;
  file_path: string;
  alt_text: string | null;
};

export default function MediaPicker({
  onSelect,
  multiple = false,
}: {
  onSelect: (ids: string[]) => void;
  multiple?: boolean;
}) {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setMedia(data || []));
  }, []);

  function handleSelect(id: string) {
    if (!multiple) {
      onSelect([id]);
      return;
    }

    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id];
      onSelect(next);
      return next;
    });
  }

  return (
    <div className="grid grid-cols-4 gap-3">
      {media.map((item) => (
        <button
          key={item.id}
          onClick={() => handleSelect(item.id)}
          className="border hover:border-black"
        >
          <Image
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${item.file_path}`}
            alt={item.alt_text || ""}
            width={240}
            height={160}
            unoptimized
          />
        </button>
      ))}
    </div>
  );
}
