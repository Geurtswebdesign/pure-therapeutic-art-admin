import type { z } from "zod";
import {
  ContentBlockSchema,
  ParagraphBlockSchema,
  ImageBlockSchema,
  GalleryBlockSchema,
  AccordionBlockSchema,
} from "./blockSchemas";

export type ContentBlock = z.infer<typeof ContentBlockSchema>;
export type ParagraphBlock = z.infer<typeof ParagraphBlockSchema>;
export type ImageBlock = z.infer<typeof ImageBlockSchema>;
export type GalleryBlock = z.infer<typeof GalleryBlockSchema>;
export type AccordionBlock = z.infer<typeof AccordionBlockSchema>;
