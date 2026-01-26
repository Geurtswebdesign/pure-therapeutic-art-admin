import Image from "next/image";

type GalleryImage = {
  src: string;
  alt?: string;
  caption?: string;
};

export default function GalleryBlock({
  images,
}: {
  images: GalleryImage[];
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-6">
      {images.map((img, i) => (
        <figure key={i}>
          <Image
            src={img.src}
            alt={img.alt ?? ""}
            width={600}
            height={400}
            className="w-full h-auto"
          />
          {img.caption && (
            <figcaption className="text-xs text-gray-500 mt-1">
              {img.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
