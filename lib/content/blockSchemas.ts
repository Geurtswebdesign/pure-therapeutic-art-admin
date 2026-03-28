import { z } from "zod";

/* ---------------- Paragraph ---------------- */

export const ParagraphBlockSchema = z.object({
  type: z.literal("paragraph"),
  data: z.object({
    text: z.string(),
  }),
});

/* ---------------- Image ---------------- */

export const ImageBlockSchema = z.object({
  type: z.literal("image"),
  data: z.object({
    src: z.string().url(),
    alt: z.string().optional(),
    caption: z.string().optional(),
  }),
});

/* ---------------- Gallery ---------------- */

export const GalleryBlockSchema = z.object({
  type: z.literal("gallery"),
  data: z.object({
    images: z.array(
      z.object({
        src: z.string().url(),
        alt: z.string().optional(),
        caption: z.string().optional(),
      })
    ),
  }),
});

/* ---------------- Accordion ---------------- */

export const AccordionBlockSchema = z.object({
  type: z.literal("accordion"),
  data: z.object({
    items: z.array(
      z.object({
        id: z.string().optional(),
        title: z.string(),
        body: z.string(),
      })
    ),
  }),
});

/* ---------------- Union ---------------- */

export const ContentBlockSchema = z.discriminatedUnion("type", [
  ParagraphBlockSchema,
  ImageBlockSchema,
  GalleryBlockSchema,
  AccordionBlockSchema,
]);

export const ContentBlocksSchema = z.array(ContentBlockSchema);
