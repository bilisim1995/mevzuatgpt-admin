export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  subject: string;
  category: 'technical' | 'billing' | 'general' | 'feature_request' | 'bug_report' | 'account';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  message_count: number;
  last_reply_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_name: string;
  sender_email: string;
  is_admin: boolean;
}

export interface SupportTicketDetail extends SupportTicket {
  messages: SupportMessage[];
}

export interface SupportTicketsResponse {
  tickets: SupportTicket[];
  total_count: number;
  has_more: boolean;
  page: number;
  limit: number;
}

export interface SupportTicketStats {
  total_tickets: number;
  open_tickets: number;
  answered_tickets: number;
  closed_tickets: number;
  by_category: {
    technical: number;
    billing: number;
    general: number;
    feature_request: number;
    bug_report: number;
    account: number;
  };
  by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  avg_response_time: number;
}

export interface SupportTicketFilters {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  priority?: string;
  user_id?: string;
  search?: string;
}

export interface ReplyTicketData {
  message: string;
}

export interface UpdateTicketStatusData {
  status: 'open' | 'in_progress' | 'waiting_response' | 'resolved' | 'closed';
}

export interface SupportCategory {
  value: string;
  label: string;
}

export interface SupportPriority {
  value: string;
  label: string;
}

export interface SupportStatus {
  value: string;
  label: string;
}