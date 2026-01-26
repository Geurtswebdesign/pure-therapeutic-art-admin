import type { z } from "zod";
import { ContentBlockSchema } from "./blockSchemas";

export type ContentBlock = z.infer<typeof ContentBlockSchema>;
