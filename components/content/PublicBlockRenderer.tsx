"use client";

import type { ContentBlock } from "@/lib/content/types";
import Paragraph from "./public/Paragraph";
import ImageBlock from "./public/ImageBlock";
import GalleryBlock from "./public/GalleryBlock";

export default function PublicBlockRenderer({
  blocks,
}: {
  blocks: ContentBlock[];
}) {
  return (
    <>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </>
  );
}
