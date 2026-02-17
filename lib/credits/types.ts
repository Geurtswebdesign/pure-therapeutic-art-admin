export type CreditTransactionUI = {
  id: string;
  delta: number;
  reason: string;
  created_at: string;
};

export type CreditWallet = {
  user_id: string;
  credits_available: number;
  credits_total_purchased: number;
  updated_at: string;
};

export type CreditTransaction = {
  id: string;
  user_id: string;
  delta: number;
  balance_after: number;
  reason: string;
  admin_id: string | null;
  created_at: string;
};

export type AdminUserProfile = {
  user_id: string;
  email?: string | null;   // 👈 optioneel
  display_name: string | null;
  role: "user" | "admin";
  profile_data?: {
    first_name?: string | null;
    last_name?: string | null;
    nickname?: string | null;
    website?: string | null;
    bio?: string | null;
  } | null;
  bio?: string | null;
  created_at?: string | null;
};