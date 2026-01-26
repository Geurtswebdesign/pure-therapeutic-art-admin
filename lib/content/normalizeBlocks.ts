import { normalizeHtml } from "./normalizeHtml";
import type { ContentBlock, ParagraphBlock } from "./types";

/**
 * Normalize blocks before saving them to the database.
 * Only paragraph blocks contain editor HTML.
 */
export function normalizeBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.map((block) => {
    if (block.type === "paragraph") {
      return normalizeParagraphBlock(block);
    }

    // Other block types are already structured data
    return block;
  });
}

function normalizeParagraphBlock(block: ParagraphBlock): ParagraphBlock {
  return {
    type: "paragraph",
    data: {
      html: normalizeHtml(block.data.html),
    },
  };
}
