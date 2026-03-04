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

export async function getRuntimeSecuritySettings(): Promise<SecuritySettings> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("scope", "global")
      .is("scope_id", null)
      .eq("key", "security")
      .maybeSingle<{ value: unknown }>();

    if (error) return DEFAULT_SECURITY_SETTINGS;
    const value = asObject(data?.value);
    if (!value) return DEFAULT_SECURITY_SETTINGS;

    return normalizeSecuritySettings({
      loginAttemptLimit: value.loginAttemptLimit as number | undefined,
      ipAttemptLimit: value.ipAttemptLimit as number | undefined,
      loginWindowMinutes: value.loginWindowMinutes as number | undefined,
      escalationThreshold: value.escalationThreshold as number | undefined,
      escalationWindowMinutes: value.escalationWindowMinutes as number | undefined,
      adminSessionTimeoutMinutes: value.adminSessionTimeoutMinutes as number | undefined,
      maintenanceMode: value.maintenanceMode as boolean | undefined,
      mfaPolicy: value.mfaPolicy as "opt_in" | "required_admin" | undefined,
    });
  } catch {
    return DEFAULT_SECURITY_SETTINGS;
  }
}
