import { createAdminClient } from "@/lib/supabase/admin";
import { logSecurityAuditEvent } from "@/lib/security/audit";

export async function invalidateUserSessions(input: {
  userIds: string[];
  reason: string;
  updatedBy?: string | null;
}) {
  const userIds = [...new Set(input.userIds.filter(Boolean))];
  if (!userIds.length) return;

  const nowIso = new Date().toISOString();
  const supabase = createAdminClient();

  const payload = userIds.map((userId) => ({
    user_id: userId,
    invalid_after: nowIso,
    reason: input.reason,
    updated_by: input.updatedBy ?? null,
    updated_at: nowIso,
  }));

  await supabase
    .from("auth_session_invalidations")
    .upsert(payload, { onConflict: "user_id" });

  await logSecurityAuditEvent({
    eventType: "session_invalidation",
    severity: "warning",
    actorUserId: input.updatedBy ?? null,
    details: {
      reason: input.reason,
      affectedUsers: userIds.length,
    },
  });
}

export async function invalidateAdminSessions(input: {
  reason: string;
  updatedBy?: string | null;
}) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("role", "admin");

  const userIds = (data ?? [])
    .map((row) => row.user_id as string)
    .filter(Boolean);

  await invalidateUserSessions({
    userIds,
    reason: input.reason,
    updatedBy: input.updatedBy ?? null,
  });
}

