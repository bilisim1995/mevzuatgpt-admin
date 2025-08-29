import { User, UsersResponse, UserUpdateData, BanUserData, UpdateCreditsData, UserFilters } from '@/types/user';
import { STORAGE_KEYS, API_CONFIG } from '@/constants/api';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;
  
  if (!token) {
    // Token yoksa çıkış yap ve login sayfasına yönlendir
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/admin/login';
    }
    throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

export async function getUsers(filters: UserFilters = {}): Promise<UsersResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.role) params.append('role', filters.role);
  if (filters.is_banned !== undefined) params.append('is_banned', filters.is_banned.toString());
  if (filters.search) params.append('search', filters.search);

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}?${params}`,
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

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function getUserDetails(userId: string): Promise<User> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}/${userId}`,
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
      throw new Error(`Kullanıcı detayları alınırken hata oluştu: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function updateUser(userId: string, userData: UserUpdateData): Promise<any> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}/${userId}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(userData),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Kullanıcı güncellenirken hata oluştu' }));
      throw new Error(error.message || 'Kullanıcı güncellenirken hata oluştu');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function banUser(userId: string, banData: BanUserData): Promise<any> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/users/${userId}/ban`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(banData),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Kullanıcı banlanırken hata oluştu' }));
      throw new Error(error.message || 'Kullanıcı banlanırken hata oluştu');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function unbanUser(userId: string): Promise<any> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/users/${userId}/unban`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ban kaldırılırken hata oluştu' }));
      throw new Error(error.message || 'Ban kaldırılırken hata oluştu');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function updateUserCredits(userId: string, creditsData: UpdateCreditsData): Promise<any> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/users/${userId}/credits`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(creditsData),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Kredi güncellenirken hata oluştu' }));
      throw new Error(error.message || 'Kredi güncellenirken hata oluştu');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<any> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS}/${userId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Kullanıcı silinirken hata oluştu' }));
      throw new Error(error.message || 'Kullanıcı silinirken hata oluştu');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}