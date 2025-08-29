import { Prompt, PromptsResponse, PromptCreateData, PromptUpdateData, PromptFilters } from '@/types/prompt';
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

export async function getPrompts(filters: PromptFilters = {}): Promise<PromptsResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.provider) params.append('provider', filters.provider);
  if (filters.prompt_type) params.append('prompt_type', filters.prompt_type);
  if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
  if (filters.search) params.append('search', filters.search);

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMPTS}?${params}`,
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
        prompts: result.data.prompts || [],
        total_count: result.data.total_count || 0,
        pagination: result.data.pagination || {
          current_page: 1,
          per_page: 10,
          total_pages: 1,
          has_next: false,
          has_prev: false
        }
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

export async function getPromptDetails(promptId: string): Promise<Prompt> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMPTS}/${promptId}`,
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
      throw new Error(`Prompt detayları alınırken hata oluştu: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function createPrompt(promptData: PromptCreateData): Promise<Prompt> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMPTS}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(promptData),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Prompt oluşturulurken hata oluştu' }));
      throw new Error(error.message || 'Prompt oluşturulurken hata oluştu');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function updatePrompt(promptId: string, promptData: PromptUpdateData): Promise<Prompt> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMPTS}/${promptId}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(promptData),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Prompt güncellenirken hata oluştu' }));
      throw new Error(error.message || 'Prompt güncellenirken hata oluştu');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function deletePrompt(promptId: string): Promise<void> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMPTS}/${promptId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Prompt silinirken hata oluştu' }));
      throw new Error(error.message || 'Prompt silinirken hata oluştu');
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function refreshPromptCache(): Promise<void> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMPTS_REFRESH_CACHE}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Cache temizlenirken hata oluştu' }));
      throw new Error(error.message || 'Cache temizlenirken hata oluştu');
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}