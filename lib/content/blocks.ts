export interface ImageBlock extends BaseBlock {
  type: "image";
  data: {
    imageId: string;
    caption?: string;
    layout: "full" | "content" | "left" | "right";
    variant: "default" | "soft-frame" | "centered";
  };
}
