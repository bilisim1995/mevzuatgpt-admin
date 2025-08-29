import { RedisSystemStatus, RedisResponse } from '@/types/redis';
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
        memory_usage_mb: parseFloat(result.data.redis.info.used_memory.replace('M', '')),
        connected_clients: result.data.redis.info.connected_clients,
        uptime_seconds: result.data.redis.info.uptime,
        version: 'Unknown', // API doesn't provide this
        total_keys: result.data.redis.info.total_keys,
        active_task_progress: result.data.redis.active_task_progress,
        user_histories: result.data.redis.user_histories
      },
      celery: {
        status: result.data.celery.connection === 'healthy' ? 'healthy' : 'error',
        active_workers: result.data.celery.worker_count,
        pending_tasks: result.data.celery.scheduled_tasks,
        active_tasks: result.data.celery.active_tasks,
        worker_names: result.data.celery.active_workers || []
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

export async function clearTasks(): Promise<{ progress_deleted: number; celery_deleted: number; kombu_deleted: number; total_deleted: number }> {
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

export async function purgeCeleryQueue(): Promise<{ cleared_count: number }> {
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

export async function clearActiveTasks(): Promise<{ revoked_count: number; worker_count: number }> {
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

export async function clearAllRedis(): Promise<{ keys_before: number; keys_after: number; cleared_count: number }> {
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