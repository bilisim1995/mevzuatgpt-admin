import { 
  SearchLog, 
  SearchLogsResponse, 
  SearchLogStats,
  SearchLogFilters,
  UserSearchLogsResponse
} from '@/types/search-logs';
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

export async function getSearchLogs(filters: SearchLogFilters = {}): Promise<SearchLogsResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.user_id) params.append('user_id', filters.user_id);

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH_LOGS}?${params}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        // 401 durumunda çıkış yap ve login sayfasına yönlendir
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/admin/login';
        }
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    
    // Handle nested response structure
    if (result.data) {
      return {
        search_logs: result.data.search_logs || [],
        total_count: result.data.total_count || 0,
        has_more: result.data.has_more || false,
        page: result.data.page || 1,
        limit: result.data.limit || 50,
        filters: result.data.filters || { user_id: null }
      };
    }
    
    // Fallback for direct response structure
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function getSearchLogStats(): Promise<SearchLogStats> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH_LOG_STATS}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        // 401 durumunda çıkış yap ve login sayfasına yönlendir
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/admin/login';
        }
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw new Error(`İstatistikler alınırken hata oluştu: ${response.status}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function getUserSearchLogs(userId: string, filters: SearchLogFilters = {}): Promise<UserSearchLogsResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH_LOG_USER}/${userId}?${params}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        // 401 durumunda çıkış yap ve login sayfasına yönlendir
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          window.location.href = '/admin/login';
        }
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw new Error(`Kullanıcı arama kayıtları alınırken hata oluştu: ${response.status}`);
    }

    const result = await response.json();
    return result.data || result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}