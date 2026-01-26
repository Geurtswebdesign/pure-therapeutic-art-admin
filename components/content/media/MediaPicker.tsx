"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

export default function MediaPicker({
  onSelect,
  multiple = false,
}: {
  onSelect: (ids: string[]) => void;
  multiple?: boolean;
}) {
  const [media, setMedia] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setMedia(data || []));
  }, []);

  return (
    <div className="grid grid-cols-4 gap-3">
      {media.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect([item.id])}
          className="border hover:border-black"
        >
          <img
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${item.file_path}`}
            alt={item.alt_text || ""}
          />
        </button>
      ))}
    </div>
  );
}
