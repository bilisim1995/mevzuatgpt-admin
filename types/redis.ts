export interface RedisInfo {
  status: 'healthy' | 'warning' | 'error';
  ping_time_ms?: number;
  memory_usage_mb: number;
  connected_clients: number;
  uptime_seconds: number;
  version?: string;
  total_keys?: number;
  active_task_progress?: number;
  user_histories?: number;
  error?: string;
}

export interface CeleryInfo {
  status: 'healthy' | 'warning' | 'error';
  active_workers: number;
  pending_tasks?: number;
  active_tasks?: number;
  worker_names?: string[];
  error?: string;
}

export interface RedisConnectionInfo {
  connection_status: 'healthy' | 'timeout' | 'error';
  server_info?: {
    redis_version: string;
    uptime_seconds: number;
    uptime_days: number;
  };
  memory_info?: {
    used_memory_human: string;
    used_memory_peak_human: string;
    used_memory_rss_human: string;
    maxmemory_human: string;
  };
  connection_info?: {
    connected_clients: number;
    client_recent_max_input_buffer: number;
    client_recent_max_output_buffer: number;
    blocked_clients: number;
  };
  network_info?: {
    total_connections_received: number;
    total_commands_processed: number;
    rejected_connections: number;
    sync_full: number;
    sync_partial_ok: number;
  };
  keyspace_info?: {
    total_keys: number;
    active_task_progress: number;
    user_histories: number;
    cache_keys: number;
  };
  performance_info?: {
    keyspace_hits: number;
    keyspace_misses: number;
    hit_rate: number;
    ops_per_sec: number;
  };
  error?: string;
}

export interface RedisConnectionResponse {
  success: boolean;
  data: RedisConnectionInfo;
}

export interface CeleryWorkerRestartResponse {
  success: boolean;
  message: string;
  data: {
    workers_before: number;
    workers_after: number;
    restart_time: string;
    worker_status: 'restarted' | 'failed';
    error?: string;
  };
}

export interface RedisSystemStatus {
  timestamp: string;
  redis: RedisInfo;
  celery: CeleryInfo;
}

export interface RedisResponse {
  success: boolean;
  data: RedisSystemStatus;
}