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
      {blocks.map((block, i) => {
        if (block.type === "paragraph") {
          return <Paragraph key={i} text={block.data.text} />;
        }

        if (block.type === "image") {
          return (
            <ImageBlock
              key={i}
              src={block.data.src}
              alt={block.data.alt}
              caption={block.data.caption}
            />
          );
        }

        if (block.type === "gallery") {
          return <GalleryBlock key={i} images={block.data.images} />;
        }

        return null;
      })}
    </>
  );
}
