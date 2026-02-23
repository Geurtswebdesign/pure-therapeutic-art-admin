import { createAdminClient } from "@/lib/supabase/admin";

export type ContentAccessScope = "assignment" | "book" | "game" | "referral";

export function normalizeAccessScope(value: unknown): ContentAccessScope {
  if (value === "book" || value === "game" || value === "referral") {
    return value;
  }
  return "assignment";
}

export function scopeLabel(scope: ContentAccessScope) {
  switch (scope) {
    case "book":
      return "boek";
    case "game":
      return "spel";
    case "referral":
      return "verwijsbestand";
    default:
      return "opdracht";
  }
}

export async function getContentAccessScope(
  contentItemId: string
): Promise<ContentAccessScope> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_items")
    .select("access_scope")
    .eq("id", contentItemId)
    .maybeSingle<{ access_scope?: string | null }>();

  if (error) {
    return "assignment";
  }

  return normalizeAccessScope(data?.access_scope);
}
