"use client";

import { supabase } from "@/lib/supabase-client";

export default function BlockInserter({
  contentItemId,
}: {
  contentItemId: string;
}) {
  async function addParagraph() {
    await supabase.from("content_blocks").insert({
      content_item_id: contentItemId,
      type: "paragraph",
      order_index: 0,
      data: { text: "" },
    });

    // tijdelijke simpele refresh (later realtime)
    window.location.reload();
  }

  return (
    <div className="mt-6 text-sm text-gray-500">
      <button
        onClick={addParagraph}
        className="hover:text-black"
      >
        + Tekst toevoegen
      </button>
    </div>
  );
}
