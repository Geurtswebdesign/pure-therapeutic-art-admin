export type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
};

export type CreditWallet = {
  user_id: string;
  credits_available: number;
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
