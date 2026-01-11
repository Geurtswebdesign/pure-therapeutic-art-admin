export const CREDIT_REASONS = {
  system: "Systeemcorrectie",
  admin: "Handmatige admin-correctie",
  refund: "Terugbetaling",
} as const;

export type CreditReason = keyof typeof CREDIT_REASONS;
