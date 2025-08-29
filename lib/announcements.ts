import { 
  Announcement, 
  AnnouncementsResponse, 
  AnnouncementCreateData, 
  AnnouncementUpdateData,
  AnnouncementFilters
} from '@/types/announcement';
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

function getFormHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;
  
  if (!token) {
    throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
}

export async function getAnnouncements(filters: AnnouncementFilters = {}): Promise<AnnouncementsResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
  if (filters.search) params.append('search', filters.search);

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANNOUNCEMENTS}?${params}`,
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
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
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

export async function getAnnouncementDetails(announcementId: string): Promise<Announcement> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANNOUNCEMENTS}/${announcementId}`,
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
      throw new Error(`Duyuru detayları alınırken hata oluştu: ${response.status}`);
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

export async function createAnnouncement(announcementData: AnnouncementCreateData): Promise<Announcement> {
  try {
    const formData = new URLSearchParams();
    formData.append('title', announcementData.title);
    formData.append('content', announcementData.content);
    formData.append('priority', announcementData.priority);
    formData.append('publish_date', announcementData.publish_date);
    formData.append('is_active', announcementData.is_active.toString());

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANNOUNCEMENTS}`,
      {
        method: 'POST',
        headers: getFormHeaders(),
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Duyuru oluşturulurken hata oluştu' }));
      throw new Error(error.message || 'Duyuru oluşturulurken hata oluştu');
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

export async function updateAnnouncement(announcementId: string, announcementData: AnnouncementUpdateData): Promise<Announcement> {
  try {
    const formData = new URLSearchParams();
    if (announcementData.title) formData.append('title', announcementData.title);
    if (announcementData.content) formData.append('content', announcementData.content);
    if (announcementData.priority) formData.append('priority', announcementData.priority);
    if (announcementData.is_active !== undefined) formData.append('is_active', announcementData.is_active.toString());

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANNOUNCEMENTS}/${announcementId}`,
      {
        method: 'PUT',
        headers: getFormHeaders(),
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Duyuru güncellenirken hata oluştu' }));
      throw new Error(error.message || 'Duyuru güncellenirken hata oluştu');
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

export async function deleteAnnouncement(announcementId: string): Promise<void> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANNOUNCEMENTS}/${announcementId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Duyuru silinirken hata oluştu' }));
      throw new Error(error.message || 'Duyuru silinirken hata oluştu');
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}