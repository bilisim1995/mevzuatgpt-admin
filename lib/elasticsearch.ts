import { 
  ElasticsearchStatus, 
  ElasticsearchStatusResponse,
  ElasticsearchClearAllResponse,
  ElasticsearchClearDocumentResponse,
  ElasticsearchClearDocumentsResponse
} from '@/types/elasticsearch';
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

export async function getElasticsearchStatus(): Promise<ElasticsearchStatus> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/elasticsearch/status`,
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
      throw new Error(`Elasticsearch durumu alınırken hata oluştu: ${response.status}`);
    }

    const result: ElasticsearchStatusResponse = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function clearAllElasticsearch(): Promise<ElasticsearchClearAllResponse['data']> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/elasticsearch/clear-all`,
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
      const error = await response.json().catch(() => ({ message: 'Elasticsearch temizlenirken hata oluştu' }));
      throw new Error(error.message || 'Elasticsearch temizlenirken hata oluştu');
    }

    const result: ElasticsearchClearAllResponse = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function clearElasticsearchDocument(documentId: string): Promise<ElasticsearchClearDocumentResponse['data']> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/elasticsearch/clear-document/${documentId}`,
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
      const error = await response.json().catch(() => ({ message: 'Doküman temizlenirken hata oluştu' }));
      throw new Error(error.message || 'Doküman temizlenirken hata oluştu');
    }

    const result: ElasticsearchClearDocumentResponse = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function clearElasticsearchDocuments(documentIds: string[]): Promise<ElasticsearchClearDocumentsResponse['data']> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/elasticsearch/clear-documents`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(documentIds),
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
      const error = await response.json().catch(() => ({ message: 'Dokümanlar temizlenirken hata oluştu' }));
      throw new Error(error.message || 'Dokümanlar temizlenirken hata oluştu');
    }

    const result: ElasticsearchClearDocumentsResponse = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}