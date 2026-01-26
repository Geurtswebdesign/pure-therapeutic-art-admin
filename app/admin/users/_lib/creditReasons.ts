/**
 * Shared domain constants for admin user credit logic.
 * Used by both server actions and admin UI components.
 * Must stay colocated with admin/users.
 */

export const CREDIT_REASONS = {
  system: "Systeemcorrectie",
  admin: "Handmatige admin-correctie",
  refund: "Terugbetaling",
} as const;

export type CreditReason = keyof typeof CREDIT_REASONS;
