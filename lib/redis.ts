import { RedisSystemStatus, RedisResponse, CeleryInfo } from '@/types/redis';
import { RedisConnectionInfo, RedisConnectionResponse, CeleryWorkerRestartResponse } from '@/types/redis';
import { STORAGE_KEYS, API_CONFIG } from '@/constants/api';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;
  
  if (!token) {
    throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

export async function getSystemStatus(): Promise<RedisSystemStatus> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/system/status`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/admin/login';
        }
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw new Error(`Sistem durumu alınırken hata oluştu: ${response.status}`);
    }

    const result = await response.json();
    
    // Transform API response to match our interface
    const transformedData: RedisSystemStatus = {
      timestamp: new Date().toISOString(),
      redis: {
        status: result.data.redis.connection === 'healthy' ? 'healthy' : 'error',
        ping_time_ms: 0, // API doesn't provide this
        memory_usage_mb: result.data.redis.info?.used_memory ? parseFloat(result.data.redis.info.used_memory.replace('M', '')) : 0,
        connected_clients: result.data.redis.info?.connected_clients || 0,
        uptime_seconds: result.data.redis.info?.uptime || 0,
        version: 'Unknown', // API doesn't provide this
        total_keys: result.data.redis.info?.total_keys || 0,
        active_task_progress: result.data.redis?.active_task_progress || 0,
        user_histories: result.data.redis?.user_histories || 0
      },
      celery: {
        worker_status: 'running', // Geçici olarak sabit değer
        process_count: 0,
        process_ids: [],
        task_stats: {
          total_tasks_in_redis: 0
        },
        timestamp: new Date().toISOString()
      }
    };
    
    return transformedData;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function clearTasks(): Promise<{ progress_keys_deleted: number; celery_keys_deleted: number; kombu_keys_deleted: number; total_deleted: number; timestamp: string }> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/redis/clear-tasks`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/admin/login';
        }
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      const error = await response.json().catch(() => ({ message: 'Task\'lar temizlenirken hata oluştu' }));
      throw new Error(error.message || 'Task\'lar temizlenirken hata oluştu');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function purgeCeleryQueue(): Promise<{ purged_tasks: number; timestamp: string }> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/celery/purge-queue`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/admin/login';
        }
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      const error = await response.json().catch(() => ({ message: 'Celery queue temizlenirken hata oluştu' }));
      throw new Error(error.message || 'Celery queue temizlenirken hata oluştu');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function clearActiveTasks(): Promise<{ revoked_count: number; worker_count: number; timestamp: string }> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/celery/clear-active`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/admin/login';
        }
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      const error = await response.json().catch(() => ({ message: 'Aktif task\'lar temizlenirken hata oluştu' }));
      throw new Error(error.message || 'Aktif task\'lar temizlenirken hata oluştu');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function clearAllRedis(): Promise<{ keys_deleted: number; keys_remaining: number; timestamp: string }> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/redis/clear-all`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/admin/login';
        }
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      const error = await response.json().catch(() => ({ message: 'Redis temizlenirken hata oluştu' }));
      throw new Error(error.message || 'Redis temizlenirken hata oluştu');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function getCeleryStatus(): Promise<CeleryInfo> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/celery/status`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/admin/login';
        }
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw new Error(`Celery durumu alınırken hata oluştu: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function restartCeleryWorkerByPid(pid: string, force: boolean = false): Promise<{ success: boolean; message: string; data: any }> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/celery/worker/${pid}?force=${force}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/admin/login';
        }
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw new Error(`Celery worker restart edilirken hata oluştu: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function startCeleryWorker(): Promise<{ success: boolean; message: string; data: any }> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/celery/start`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/admin/login';
        }
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw new Error(`Celery worker başlatılırken hata oluştu: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function restartCeleryWorkerNew(): Promise<{ success: boolean; message: string; data: any }> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/celery/restart`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/admin/login';
        }
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw new Error(`Celery worker yeniden başlatılırken hata oluştu: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function getRedisConnections(): Promise<RedisConnectionInfo> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/redis/connections`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/admin/login';
        }
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw new Error(`Redis bağlantı bilgileri alınırken hata oluştu: ${response.status}`);
    }

    const result: RedisConnectionResponse = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function restartCeleryWorker(): Promise<CeleryWorkerRestartResponse['data']> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/celery/restart-worker`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/admin/login';
        }
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      const error = await response.json().catch(() => ({ message: 'Celery worker yeniden başlatılırken hata oluştu' }));
      throw new Error(error.message || 'Celery worker yeniden başlatılırken hata oluştu');
    }

    const result: CeleryWorkerRestartResponse = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

// Yeni Redis Connection Management Endpoint'leri
export interface RedisConnectionDetails {
  summary: {
    total_connections: number;
    max_allowed: number;
    usage_percentage: number;
    available: number;
  };
  breakdown: {
    fastapi_pool: {
      max_connections: number;
      created_connections: number;
      description: string;
    };
    celery_workers: {
      worker_count: number;
      estimated_connections_per_worker: number;
      total_estimated: number;
      description: string;
    };
    other: {
      estimated: number;
      description: string;
    };
  };
  recommendations: (string | { severity?: string; message: string; action?: string })[];
}

export interface RedisCleanupResponse {
  success: boolean;
  message: string;
  data: {
    connections_before: number;
    connections_after: number;
    freed_connections: number;
    celery_restarted: boolean;
    recommendations: string[];
  };
}

export async function getRedisConnectionDetails(): Promise<RedisConnectionDetails> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/redis/connection-details`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/admin/login';
        }
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw new Error(`Redis connection detayları alınırken hata oluştu: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function cleanupRedisConnections(restartCelery: boolean = true): Promise<RedisCleanupResponse> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/redis/cleanup-connections?restart_celery=${restartCelery}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/admin/login';
        }
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      const error = await response.json().catch(() => ({ message: 'Redis connection temizleme sırasında hata oluştu' }));
      throw new Error(error.message || 'Redis connection temizleme sırasında hata oluştu');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}