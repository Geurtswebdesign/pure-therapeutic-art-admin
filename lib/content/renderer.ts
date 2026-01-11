export function renderBlock(block: ContentBlock) {
  switch (block.type) {
    case "paragraph":
      return <Paragraph data={block.data} />;
    case "image":
      return <ImageBlock data={block.data} />;
    case "gallery":
      return <GalleryBlock data={block.data} />;
  }
}
