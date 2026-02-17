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