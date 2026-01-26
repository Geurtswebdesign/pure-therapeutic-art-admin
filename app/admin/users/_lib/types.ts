export type UserProfile = {
  display_name: string | null;
  role: string;
};

export type AdminUserProfile = {
  user_id: string;
  email?: string | null;   // 👈 optioneel
  display_name: string | null;
  role: string;
};

export type CreditTransactionUI = {
  id: string;
  delta: number;
  reason: string;
  created_at: string;
};
