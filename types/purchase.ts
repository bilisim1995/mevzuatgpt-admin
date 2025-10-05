export interface Purchase {
  id: string;
  email: string;
  tarih: string;
  user_agent: string;
  referrer: string;
  user_ip: string;
  status: 'success' | 'pending' | 'failed' | 'cancelled';
  conversation_id: string;
  price: string;
  payment_id: string;
  fraud_status: string;
  commission_rate: string;
  commission_fee: string;
  host_reference: string;
  credit_amount: number;
  system_time: string;
  request_url: string;
  created_at: string;
  updated_at: string;
}

export interface PurchasesResponse {
  success: boolean;
  data: {
    purchases: Purchase[];
    total: number;
  };
}

export interface PurchaseStats {
  total_purchases: number;
  total_revenue: number;
  success_rate: number;
  average_order_value: number;
  recent_purchases: number;
}
