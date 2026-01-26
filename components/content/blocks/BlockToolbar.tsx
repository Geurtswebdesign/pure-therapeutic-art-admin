"use client";

import { deleteBlock, moveBlock } from "@/lib/content/block-actions";

export default function BlockToolbar({ blockId }: { blockId: string }) {
  return (
    <div className="flex gap-2 text-xs text-gray-500">
      <button onClick={() => moveBlock(blockId, "up")}>↑</button>
      <button onClick={() => moveBlock(blockId, "down")}>↓</button>
      <button
        onClick={() => {
          if (confirm("Block verwijderen?")) {
            deleteBlock(blockId).then(() => window.location.reload());
          }
        }}
        className="text-red-500"
      >
        Verwijderen
      </button>
    </div>
  );
}
