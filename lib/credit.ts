import { 
  CreditTransaction, 
  CreditTransactionsResponse, 
  CreditTransactionStats,
  CreditTransactionFilters,
  UserCreditTransactionsResponse
} from '@/types/credit';
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

export async function getCreditTransactions(filters: CreditTransactionFilters = {}): Promise<CreditTransactionsResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.transaction_type) params.append('transaction_type', filters.transaction_type);
  if (filters.user_id) params.append('user_id', filters.user_id);

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREDIT_TRANSACTIONS}?${params}`,
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
        transactions: result.data.transactions || [],
        total_count: result.data.total_count || 0,
        has_more: result.data.has_more || false,
        page: result.data.page || 1,
        limit: result.data.limit || 50,
        filters: result.data.filters || { transaction_type: null, user_id: null }
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

export async function getCreditTransactionStats(): Promise<CreditTransactionStats> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREDIT_TRANSACTION_STATS}`,
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

export async function getUserCreditTransactions(userId: string, filters: CreditTransactionFilters = {}): Promise<UserCreditTransactionsResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.transaction_type) params.append('transaction_type', filters.transaction_type);

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREDIT_USER_TRANSACTIONS}/${userId}?${params}`,
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
      throw new Error(`Kullanıcı işlemleri alınırken hata oluştu: ${response.status}`);
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

export async function addUserCredits(userId: string, amount: number, description: string): Promise<any> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREDIT_ADD}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: userId,
          amount,
          description
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Kredi eklenirken hata oluştu' }));
      throw new Error(error.message || 'Kredi eklenirken hata oluştu');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function setUserCredits(userId: string, amount: number, description: string): Promise<any> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREDIT_SET}`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: userId,
          amount,
          description
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Kredi ayarlanırken hata oluştu' }));
      throw new Error(error.message || 'Kredi ayarlanırken hata oluştu');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}