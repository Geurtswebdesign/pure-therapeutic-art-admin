"use client";

import { useState } from "react";
import BlockToolbar from "./BlockToolbar";

export default function BlockWrapper({
  block,
  children,
}: {
  block: any;
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState(false);

  return (
    <div
      onClick={() => setSelected(true)}
      className={`relative p-2 rounded border ${
        selected ? "border-blue-400 bg-blue-50" : "border-transparent"
      }`}
    >
      {selected && (
        <div className="mb-1">
          <BlockToolbar blockId={block.id} />
        </div>
      )}

      {children}
    </div>
  );
}
