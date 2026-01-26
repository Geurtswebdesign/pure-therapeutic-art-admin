"use client";

export default function GalleryBlock({ block }: { block: any }) {
  const { imageIds, columns } = block.data;

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {imageIds.map((id: string) => (
        <img key={id} src={`/api/media/${id}`} />
      ))}
    </div>
  );
}
