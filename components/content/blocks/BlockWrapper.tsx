"use client";

import { useState } from "react";
import BlockToolbar from "./BlockToolbar";

export default function BlockWrapper({
  block,
  children,
}: {
  block: { id: string };
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      onClick={() => setSelected(true)}
      className={`relative p-2 rounded border ${
        selected ? "border-blue-400 bg-blue-50" : "border-transparent"
      }`}
    >
      {selected ? (
        <div className="mb-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((prev) => !prev);
            }}
            className="text-xs text-gray-600 hover:text-black"
          >
            {collapsed ? "▶ Uitklappen" : "▼ Inklappen"}
          </button>
          <BlockToolbar blockId={block.id} />
        </div>
      ) : null}

      {!collapsed && children}
    </div>
  );
}
