export interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus';
  amount: number;
  description: string;
  search_log_id?: string | null;
  created_at: string;
  user_name: string;
  user_email: string;
}

export interface CreditTransactionsResponse {
  transactions: CreditTransaction[];
  total_count: number;
  has_more: boolean;
  page: number;
  limit: number;
  filters: {
    transaction_type: string | null;
    user_id: string | null;
  };
}

export interface CreditTransactionStats {
  total_transactions: number;
  by_type: {
    purchase: {
      count: number;
      total_amount: number;
    };
    usage: {
      count: number;
      total_amount: number;
    };
    refund: {
      count: number;
      total_amount: number;
    };
    bonus: {
      count: number;
      total_amount: number;
    };
  };
  total_credits_purchased: number;
  total_credits_used: number;
  total_credits_refunded: number;
  total_credits_bonus: number;
}

export interface CreditTransactionFilters {
  page?: number;
  limit?: number;
  transaction_type?: 'purchase' | 'usage' | 'refund' | 'bonus';
  user_id?: string;
  search?: string;
}

export interface UserCreditTransactionsResponse {
  user_info: {
    user_id: string;
    user_name: string;
    user_email: string;
  };
  transactions: CreditTransaction[];
  total_count: number;
  has_more: boolean;
  page: number;
  limit: number;
  filters: {
    transaction_type: string | null;
  };
}

export interface CreditTransactionType {
  value: string;
  label: string;
  color: string;
  icon: string;
}