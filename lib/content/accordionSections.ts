import type { ContentBlock } from "@/lib/content/types";

export type AccordionSection = {
  id: string;
  title: string;
  body: string;
};

function fallbackId() {
  return `accordion-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function createAccordionSection(): AccordionSection {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? fallbackId(),
    title: "",
    body: "",
  };
}

function hasVisibleBodyContent(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim().length > 0;
}

export function sanitizeAccordionSections(
  sections: AccordionSection[]
): AccordionSection[] {
  return sections
    .map((section) => ({
      id: section.id?.trim() || fallbackId(),
      title: section.title?.trim() || "",
      body: section.body ?? "",
    }))
    .filter(
      (section) => section.title.length > 0 || hasVisibleBodyContent(section.body)
    );
}

export function extractAccordionSectionsFromBlocks(
  blocks: ContentBlock[]
): AccordionSection[] {
  const accordionBlock = blocks.find((block) => block.type === "accordion");
  if (!accordionBlock) {
    return [];
  }

  return accordionBlock.data.items.map((item) => ({
    id: item.id?.trim() || fallbackId(),
    title: item.title ?? "",
    body: item.body ?? "",
  }));
}
