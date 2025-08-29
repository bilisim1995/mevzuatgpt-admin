export interface DashboardOverview {
  total_users: number;
  total_documents: number;
  total_queries: number;
  active_users_30d: number;
}

export interface DashboardActivity {
  queries_last_24h: number;
  avg_reliability_score: number;
  total_credit_transactions: number;
}

export interface TopCategory {
  name: string;
  count: number;
}

export interface RecentDocument {
  id: string;
  title: string;
  category: string;
  created_at: string;
}

export interface DashboardContent {
  top_categories: TopCategory[];
  recent_documents: RecentDocument[];
}

export interface DashboardSystem {
  response_time_ms: number;
  redis_status: 'healthy' | 'warning' | 'error';
  elasticsearch_status: 'healthy' | 'warning' | 'error';
  timestamp: string;
}

export interface DashboardStats {
  overview: DashboardOverview;
  activity: DashboardActivity;
  content: DashboardContent;
  system: DashboardSystem;
}

export interface DashboardStatsResponse {
  success: boolean;
  data: DashboardStats;
}