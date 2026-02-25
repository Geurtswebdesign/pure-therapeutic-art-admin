"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth/getAdminUser";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_SECURITY_SETTINGS,
  normalizeSecuritySettings,
  type SecuritySettings,
} from "@/lib/settings/security-types";

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export async function getSecuritySettings(): Promise<SecuritySettings> {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Niet geautoriseerd");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("scope", "global")
    .is("scope_id", null)
    .eq("key", "security")
    .maybeSingle<{ value: unknown }>();

  if (error) {
    throw new Error(error.message);
  }

  const value = asObject(data?.value);
  if (!value) return DEFAULT_SECURITY_SETTINGS;

  return normalizeSecuritySettings({
    loginAttemptLimit: value.loginAttemptLimit as number | undefined,
    loginWindowMinutes: value.loginWindowMinutes as number | undefined,
    adminSessionTimeoutMinutes: value.adminSessionTimeoutMinutes as number | undefined,
    maintenanceMode: value.maintenanceMode as boolean | undefined,
  });
}

export async function saveSecuritySettings(input: SecuritySettings) {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Niet geautoriseerd");
  }

  const value = normalizeSecuritySettings(input);
  const supabase = createAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("app_settings")
    .select("id")
    .eq("scope", "global")
    .is("scope_id", null)
    .eq("key", "security")
    .maybeSingle<{ id: string }>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const { error } = existing
    ? await supabase
        .from("app_settings")
        .update({
          value,
          updated_by: admin.id,
        })
        .eq("id", existing.id)
    : await supabase.from("app_settings").insert({
        scope: "global",
        scope_id: null,
        key: "security",
        value,
        updated_by: admin.id,
      });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/settings/security");
}
