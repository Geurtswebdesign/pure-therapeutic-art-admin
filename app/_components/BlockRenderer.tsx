type ParagraphBlock = {
  type: 'paragraph';
  text: string;
};

type HeadingBlock = {
  type: 'heading';
  level: 2 | 3 | 4;
  text: string;
};

type ImageBlock = {
  type: 'image';
  mediaId: string;
  caption?: string;
  alt?: string;
};

type GalleryBlock = {
  type: 'gallery';
  mediaIds: string[];
  caption?: string;
};

type Block = ParagraphBlock | HeadingBlock | ImageBlock | GalleryBlock;

export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div className="content-blocks">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return (
              <p key={index}>
                {block.text}
              </p>
            );

          case 'heading': {
            const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;
            return (
              <Tag key={index}>
                {block.text}
              </Tag>
            );
          }

          case 'image':
            return (
                <figure key={index}>
                <img
                    src={`/api/media/${block.mediaId}`}
                    alt={block.alt ?? ''}
                />
                {block.caption && (
                    <figcaption>{block.caption}</figcaption>
                )}
                </figure>
            );

          case 'gallery':
            return (
              <section key={index} className="gallery">
                <div className="gallery-items">
                  {block.mediaIds.map((id) => (
                    <img
                      key={id}
                      src={`/media/${id}`}
                      alt=""
                    />
                  ))}
                </div>

                {block.caption && (
                  <p className="gallery-caption">
                    {block.caption}
                  </p>
                )}
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
