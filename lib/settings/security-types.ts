export type SecuritySettings = {
  loginAttemptLimit: number;
  ipAttemptLimit: number;
  loginWindowMinutes: number;
  escalationThreshold: number;
  escalationWindowMinutes: number;
  adminSessionTimeoutMinutes: number;
  maintenanceMode: boolean;
};

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  loginAttemptLimit: 5,
  ipAttemptLimit: 15,
  loginWindowMinutes: 15,
  escalationThreshold: 10,
  escalationWindowMinutes: 60,
  adminSessionTimeoutMinutes: 60,
  maintenanceMode: false,
};

export function normalizeSecuritySettings(
  input: Partial<SecuritySettings> | null | undefined
): SecuritySettings {
  const safe = input ?? {};
  const toPositiveInt = (value: unknown, fallback: number) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    const int = Math.floor(parsed);
    return int > 0 ? int : fallback;
  };

  return {
    loginAttemptLimit: toPositiveInt(safe.loginAttemptLimit, DEFAULT_SECURITY_SETTINGS.loginAttemptLimit),
    ipAttemptLimit: toPositiveInt(safe.ipAttemptLimit, DEFAULT_SECURITY_SETTINGS.ipAttemptLimit),
    loginWindowMinutes: toPositiveInt(safe.loginWindowMinutes, DEFAULT_SECURITY_SETTINGS.loginWindowMinutes),
    escalationThreshold: toPositiveInt(
      safe.escalationThreshold,
      DEFAULT_SECURITY_SETTINGS.escalationThreshold
    ),
    escalationWindowMinutes: toPositiveInt(
      safe.escalationWindowMinutes,
      DEFAULT_SECURITY_SETTINGS.escalationWindowMinutes
    ),
    adminSessionTimeoutMinutes: toPositiveInt(
      safe.adminSessionTimeoutMinutes,
      DEFAULT_SECURITY_SETTINGS.adminSessionTimeoutMinutes
    ),
    maintenanceMode:
      typeof safe.maintenanceMode === "boolean"
        ? safe.maintenanceMode
        : DEFAULT_SECURITY_SETTINGS.maintenanceMode,
  };
}
