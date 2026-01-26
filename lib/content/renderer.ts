import { ContentBlocksSchema } from "./blockSchemas";
import type { ContentBlock } from "./types";

/**
 * Parse and validate raw blocks from database.
 * Invalid or malformed blocks are safely discarded.
 */
export function parseContentBlocks(input: unknown): ContentBlock[] {
  const result = ContentBlocksSchema.safeParse(input);

  if (!result.success) {
    console.warn(
      "❌ Invalid content blocks received",
      result.error.flatten()
    );
    return [];
  }

  return result.data;
}
