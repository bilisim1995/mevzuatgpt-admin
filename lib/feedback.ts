import { Feedback, FeedbackResponse, FeedbackFilters, FeedbackStats } from '@/types/feedback';
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

export async function getFeedback(filters: FeedbackFilters = {}): Promise<FeedbackResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.feedback_type) params.append('feedback_type', filters.feedback_type);

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FEEDBACK}?${params}`,
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
    
    // API response'u doğrudan kullan
    return {
      feedback_list: result.feedback_list || [],
      total_count: result.total_count || 0,
      has_more: result.has_more || false,
      page: result.page || 1,
      limit: result.limit || 50
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function getUserFeedback(userId: string, filters: FeedbackFilters = {}): Promise<FeedbackResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.feedback_type) params.append('feedback_type', filters.feedback_type);

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_FEEDBACK}/${userId}?${params}`,
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
      throw new Error(`Kullanıcı feedback'leri alınırken hata oluştu: ${response.status}`);
    }

    const result = await response.json();
    
    // API response'u doğrudan kullan
    return {
      feedback_list: result.feedback_list || [],
      total_count: result.total_count || 0,
      has_more: result.has_more || false,
      page: result.page || 1,
      limit: result.limit || 50
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function deleteFeedback(feedbackId: string): Promise<void> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FEEDBACK}/${feedbackId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Feedback silinirken hata oluştu' }));
      throw new Error(error.message || 'Feedback silinirken hata oluştu');
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function getFeedbackStats(): Promise<FeedbackStats> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FEEDBACK_STATS}`,
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
      throw new Error(`Feedback istatistikleri alınırken hata oluştu: ${response.status}`);
    }

    const result = await response.json();
    
    // API response'u doğrudan kullan
    return {
      total_feedback: result.total_feedback || 0,
      like_feedback: result.like_feedback || 0,
      dislike_feedback: result.dislike_feedback || 0,
      like_percentage: result.like_percentage || 0,
      dislike_percentage: result.dislike_percentage || 0
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}