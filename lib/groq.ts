import { 
  GroqSettings, 
  GroqSettingsResponse, 
  GroqModelsResponse, 
  GroqCreativityPresetsResponse,
  GroqStatusResponse,
  GroqTestResponse,
  GroqResetResponse
} from '@/types/groq';
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

export async function getGroqSettings(): Promise<GroqSettings> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/groq/settings`,
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
      throw new Error(`Groq ayarları alınırken hata oluştu: ${response.status}`);
    }

    const result = await response.json();
    return result.current_settings || result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function updateGroqSettings(settings: Partial<GroqSettings>): Promise<GroqSettings> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/groq/settings`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings),
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
      const error = await response.json().catch(() => ({ message: 'Groq ayarları güncellenirken hata oluştu' }));
      throw new Error(error.message || 'Groq ayarları güncellenirken hata oluştu');
    }

    const result = await response.json();
    return result.current_settings || result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function getGroqModels(): Promise<GroqModelsResponse['data']> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/groq/models`,
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
      throw new Error(`Groq modelleri alınırken hata oluştu: ${response.status}`);
    }

    const result = await response.json();
    console.log('Groq models API response:', result);
    
    // Backend'den gelen model listesini işle
    if (result.success && result.data) {
      return {
        models: Object.entries(result.data).map(([modelName, description]: [string, any]) => ({
          id: modelName,
          model_name: modelName,
          name: modelName,
          description: typeof description === 'string' ? description : `${modelName} AI model`,
          context_length: 8192,
          performance_tier: 'standard',
          best_use_cases: ['general'],
          is_available: true
        })),
        current_default: '',
        total_count: Object.keys(result.data).length
      };
    }
    
    // Fallback
    return {
      models: [],
      current_default: '',
      total_count: 0
    };
  } catch (error) {
    console.error('Groq models fetch error:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function getGroqCreativityPresets(): Promise<GroqCreativityPresetsResponse['data']> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/groq/creativity-presets`,
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
      throw new Error(`Yaratıcılık ön ayarları alınırken hata oluştu: ${response.status}`);
    }

    const result: GroqCreativityPresetsResponse = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function applyGroqPreset(presetName: string): Promise<GroqSettings> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/groq/apply-preset/${encodeURIComponent(presetName)}`,
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
      const error = await response.json().catch(() => ({ message: 'Yaratıcılık ön ayarı uygulanırken hata oluştu' }));
      throw new Error(error.message || 'Yaratıcılık ön ayarı uygulanırken hata oluştu');
    }

    const result = await response.json();
    return result.current_settings || result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function getGroqStatus(): Promise<GroqStatusResponse> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GROQ_STATUS}`,
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
      throw new Error(`Groq durumu alınırken hata oluştu: ${response.status}`);
    }

    const result = await response.json();
    console.log('Groq status API response:', result);
    
    // Backend response'u GroqStatusResponse formatına dönüştür
    return {
      success: result.success || true,
      data: result.data || result
    };
  } catch (error) {
    console.error('Groq status fetch error:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function testGroqSettings(testQuery: string): Promise<GroqTestResponse> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/groq/test-settings?test_query=${encodeURIComponent(testQuery)}`,
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
      const error = await response.json().catch(() => ({ message: 'Groq ayarları test edilirken hata oluştu' }));
      throw new Error(error.message || 'Groq ayarları test edilirken hata oluştu');
    }

    const result = await response.json();
    console.log('Groq test API response:', result);
    
    // Backend response'u GroqTestResponse formatına dönüştür
    return {
      success: result.success || true,
      data: result.data || result
    };
  } catch (error) {
    console.error('Groq test fetch error:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function resetGroqSettings(): Promise<GroqSettings> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/groq/reset-settings`,
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
      const error = await response.json().catch(() => ({ message: 'Groq ayarları sıfırlanırken hata oluştu' }));
      throw new Error(error.message || 'Groq ayarları sıfırlanırken hata oluştu');
    }

    const result = await response.json();
    return result.current_settings || result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}