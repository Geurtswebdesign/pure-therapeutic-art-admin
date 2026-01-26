"use client";

import BlockWrapper from "./BlockWrapper";
import ParagraphBlock from "./ParagraphBlock";
import ImageBlock from "./ImageBlock";
import GalleryBlock from "./GalleryBlock";

export default function BlockRenderer({ block }: { block: any }) {
  let content = null;

  switch (block.type) {
    case "paragraph":
      content = <ParagraphBlock block={block} />;
      break;

    case "image":
      content = <ImageBlock block={block} />;
      break;

    case "gallery":
      content = <GalleryBlock block={block} />;
      break;
  }

  if (!content) return null;

  return <BlockWrapper block={block}>{content}</BlockWrapper>;
}


