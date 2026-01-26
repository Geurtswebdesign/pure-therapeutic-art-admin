import Image from "next/image";

type Props = {
  src: string;
  alt?: string;
  caption?: string;
};

export default function ImageBlock({ src, alt, caption }: Props) {
  return (
    <figure className="my-6">
      <Image
        src={src}
        alt={alt ?? ""}
        width={1200}
        height={800}
        className="w-full h-auto"
      />
      {caption && (
        <figcaption className="text-sm text-gray-500 mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
