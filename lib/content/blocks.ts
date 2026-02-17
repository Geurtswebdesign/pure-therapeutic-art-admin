"use server";

export type ParagraphBlock = {
  id: string;
  type: "paragraph";
  order_index: number;
  data: {
    text: string;
  };
};

export type ImageBlock = {
  id: string;
  type: "image";
  order_index: number;
  data: {
    imageId: string;
    caption?: string;
    layout: "content" | "full" | "left" | "right";
    variant: "default" | "soft-frame" | "centered";
  };
};

export type GalleryBlock = {
  id: string;
  type: "gallery";
  order_index: number;
  data: {
    imageIds: string[];
    columns: 2 | 3 | 4;
    variant: "grid";
  };
};

export type ContentBlock =
  | ParagraphBlock
  | ImageBlock
  | GalleryBlock;
