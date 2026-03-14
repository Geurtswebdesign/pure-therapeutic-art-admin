import { createAdminClient } from "@/lib/supabase/admin";

const DELETED_CREDIT_PACKS_KEY = "deleted_credit_packs";

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function normalizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function getDeletedCreditPackIds(): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("scope", "global")
    .is("scope_id", null)
    .eq("key", DELETED_CREDIT_PACKS_KEY)
    .maybeSingle<{ value: unknown }>();

  if (error) {
    throw new Error(error.message);
  }

  const value = asObject(data?.value);
  return normalizeIds(value?.ids);
}

export async function markCreditPackDeleted(packId: string, adminId: string) {
  const supabase = createAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("app_settings")
    .select("id, value")
    .eq("scope", "global")
    .is("scope_id", null)
    .eq("key", DELETED_CREDIT_PACKS_KEY)
    .maybeSingle<{ id: string; value: unknown }>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const currentIds = normalizeIds(asObject(existing?.value)?.ids);
  const nextIds = Array.from(new Set([...currentIds, packId]));

  const payload = {
    value: { ids: nextIds },
    updated_by: adminId,
  };

  const { error } = existing?.id
    ? await supabase
        .from("app_settings")
        .update(payload)
        .eq("id", existing.id)
    : await supabase.from("app_settings").insert({
        scope: "global",
        scope_id: null,
        key: DELETED_CREDIT_PACKS_KEY,
        ...payload,
      });

  if (error) {
    throw new Error(error.message);
  }
}
