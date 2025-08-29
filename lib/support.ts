import { 
  SupportTicket, 
  SupportTicketDetail, 
  SupportTicketsResponse, 
  SupportTicketStats,
  SupportTicketFilters,
  ReplyTicketData,
  UpdateTicketStatusData
} from '@/types/support';
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

export async function getSupportTickets(filters: SupportTicketFilters = {}): Promise<SupportTicketsResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status) params.append('status', filters.status);
  if (filters.category) params.append('category', filters.category);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.user_id) params.append('user_id', filters.user_id);
  if (filters.search) params.append('search', filters.search);

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUPPORT_TICKETS}?${params}`,
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
        tickets: result.data.tickets || [],
        total_count: result.data.total_count || 0,
        has_more: result.data.has_more || false,
        page: result.data.page || 1,
        limit: result.data.limit || 20
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

export async function getSupportTicketDetails(ticketId: string): Promise<SupportTicketDetail> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUPPORT_TICKETS}/${ticketId}`,
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
      throw new Error(`Ticket detayları alınırken hata oluştu: ${response.status}`);
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

export async function replyToTicket(ticketId: string, replyData: ReplyTicketData): Promise<any> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUPPORT_TICKET_REPLY}/${ticketId}/reply`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(replyData),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Yanıt gönderilirken hata oluştu' }));
      throw new Error(error.message || 'Yanıt gönderilirken hata oluştu');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function updateTicketStatus(ticketId: string, statusData: UpdateTicketStatusData): Promise<any> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUPPORT_TICKET_STATUS}/${ticketId}/status`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(statusData),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ticket durumu güncellenirken hata oluştu' }));
      throw new Error(error.message || 'Ticket durumu güncellenirken hata oluştu');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function getSupportTicketStats(): Promise<SupportTicketStats> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUPPORT_TICKET_STATS}`,
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

export async function getUserTickets(userId: string): Promise<SupportTicketsResponse> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUPPORT_USER_TICKETS}/${userId}/tickets`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      }
      throw new Error(`Kullanıcı ticketları alınırken hata oluştu: ${response.status}`);
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

export async function deleteSupportTicket(ticketId: string): Promise<void> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUPPORT_TICKETS}/${ticketId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Ticket silinirken hata oluştu' }));
      throw new Error(error.message || 'Ticket silinirken hata oluştu');
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}