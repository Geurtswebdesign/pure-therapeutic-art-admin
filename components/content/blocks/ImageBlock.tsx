"use client";

export default function ImageBlock({ block }: { block: any }) {
  const { imageId, layout, variant } = block.data;

  return (
    <div className={`image-block layout-${layout} variant-${variant}`}>
      <img
        src={`/api/media/${imageId}`}
        alt=""
        className="max-w-full"
      />
    </div>
  );
}
