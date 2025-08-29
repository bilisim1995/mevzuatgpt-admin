export interface SearchLog {
  id: string;
  user_id: string;
  query: string;
  results_count: number;
  execution_time: number;
  credits_used: number;
  reliability_score: number;
  response: string;
  ip_address: string;
  created_at: string;
  user_name: string;
  user_email: string;
}

export interface SearchLogsResponse {
  search_logs: SearchLog[];
  total_count: number;
  has_more: boolean;
  page: number;
  limit: number;
  filters: {
    user_id: string | null;
  };
}

export interface SearchLogStats {
  total_searches: number;
  total_users: number;
  avg_execution_time: number;
  avg_results_count: number;
  avg_credits_used: number;
  avg_reliability_score: number;
  today_searches: number;
  successful_searches: number;
  failed_searches: number;
  top_queries: {
    query: string;
    count: number;
  }[];
}

export interface UserSearchLogsResponse {
  user_info: {
    user_id: string;
    user_name: string;
    user_email: string;
  };
  search_logs: SearchLog[];
  total_count: number;
  has_more: boolean;
  page: number;
  limit: number;
}

export interface SearchLogFilters {
  page?: number;
  limit?: number;
  user_id?: string;
  search?: string;
}