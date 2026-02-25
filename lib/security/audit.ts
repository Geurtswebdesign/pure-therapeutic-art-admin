import { createAdminClient } from "@/lib/supabase/admin";

type SecurityAuditSeverity = "info" | "warning" | "critical";

type SecurityAuditInput = {
  eventType: string;
  severity?: SecurityAuditSeverity;
  actorUserId?: string | null;
  targetUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown>;
};

export async function logSecurityAuditEvent(input: SecurityAuditInput) {
  try {
    const supabase = createAdminClient();
    await supabase.from("security_audit_logs").insert({
      event_type: input.eventType,
      severity: input.severity ?? "info",
      actor_user_id: input.actorUserId ?? null,
      target_user_id: input.targetUserId ?? null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      details: input.details ?? {},
    });
  } catch {
    // Never block core flows when audit logging fails.
  }
}

