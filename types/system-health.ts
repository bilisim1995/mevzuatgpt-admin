export interface ComponentHealth {
  status: 'healthy' | 'warning' | 'error' | 'not_configured';
  error?: string;
  last_check: string;
}

export interface DatabaseHealth extends ComponentHealth {
  connection_time_ms?: number;
  total_documents?: number;
  total_users?: number;
  provider?: string;
}

export interface RedisHealth extends ComponentHealth {
  ping_time_ms?: number;
  memory_usage_mb?: number;
  connected_clients?: number;
  uptime_seconds?: number;
  version?: string;
}

export interface ElasticsearchHealth extends ComponentHealth {
  cluster_status?: 'green' | 'yellow' | 'red';
  cluster_name?: string;
  document_count?: number;
  vector_dimensions?: number;
}

export interface CeleryHealth extends ComponentHealth {
  active_workers?: number;
  pending_tasks?: number;
  completed_tasks_today?: number;
  failed_tasks_today?: number;
  queue_backend?: string;
}

export interface EmailHealth extends ComponentHealth {
  connection_time_ms?: number;
  provider?: string;
  host?: string;
  port?: number;
  user?: string;
}

export interface AIServiceHealth {
  status: 'healthy' | 'warning' | 'error' | 'not_configured';
  api_response_time_ms?: number;
  model?: string;
  error?: string;
}

export interface AIServicesHealth {
  openai: AIServiceHealth;
  groq: AIServiceHealth;
}

export interface StorageHealth extends ComponentHealth {
  provider?: string;
  total_files?: number;
  storage_used_gb?: number;
  cdn_url?: string;
}

export interface APIHealth extends ComponentHealth {
  avg_response_time_ms?: number;
  requests_last_hour?: number;
  avg_reliability_score?: number;
  uptime_status?: string;
}

export interface SystemHealthData {
  timestamp: string;
  overall_status: 'healthy' | 'warning' | 'degraded' | 'critical';
  response_time_ms: number;
  components: {
    database: DatabaseHealth;
    redis: RedisHealth;
    elasticsearch: ElasticsearchHealth;
    celery: CeleryHealth;
    email: EmailHealth;
    ai_services: AIServicesHealth;
    storage: StorageHealth;
    api: APIHealth;
  };
}

export interface SystemHealthResponse {
  success: boolean;
  data: SystemHealthData;
}