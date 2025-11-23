import { API_CONFIG, STORAGE_KEYS } from "@/constants/api";

export interface PortalScanItem {
  id: number;
  portal: boolean;
  baslik: string;
  link: string;
}

export interface PortalScanSection {
  section_title: string;
  items_count: number;
  items: PortalScanItem[];
}

export interface SectionStats {
  section_title: string;
  total: number;
  portal: number;
  not_portal: number;
}

export interface PortalScanResponse {
  success: boolean;
  message: string;
  data: {
    total_sections: number;
    total_items: number;
    portal_documents_count: number;
    sections: PortalScanSection[];
    sections_stats: SectionStats[];
  };
}

export interface Kurum {
  _id: string;
  kurum_adi: string;
  aciklama?: string;
  kurum_logo?: string | null;
  olusturulma_tarihi?: string;
  [key: string]: any;
}

export interface KurumlarResponse {
  success: boolean;
  message?: string;
  data: Kurum[];
  total?: number;
}

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

export async function getPortalScan(kurumId: string, detsis?: string, type?: string): Promise<PortalScanResponse> {
  try {
    const headers = getAuthHeaders();
    
    const requestBody: any = {
      id: kurumId
    };
    
    if (detsis !== undefined) {
      requestBody.detsis = detsis;
    }
    
    if (type !== undefined) {
      requestBody.type = type;
    }
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/kurum/portal-scan`,
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
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
      if (response.status === 405) {
        throw new Error('API endpoint\'i bu HTTP metodunu desteklemiyor. Lütfen backend yapılandırmasını kontrol edin.');
      }
      if (response.status === 500) {
        // 500 hatası durumunda response body'yi kontrol et
        try {
          const responseText = await response.text();
          const lowerText = responseText.toLowerCase();
          
          // Önce response text'in kendisinde kurum bulunamadı kontrolü yap
          if ((lowerText.includes('kurum') && (lowerText.includes('bulunamadı') || lowerText.includes('bulunamadi') || lowerText.includes('not found') || lowerText.includes('not_found'))) ||
              lowerText.includes('kurum bulunamadı') ||
              lowerText.includes('kurum not found') ||
              lowerText.includes('kurum_not_found')) {
            throw new Error('Kurum bulunamadı');
          }
          
          // JSON parse etmeyi dene
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            // JSON parse edilemezse, text'te kurum bulunamadı yoksa genel hata
            throw new Error('Sunucu hatası oluştu');
          }
          
          // data.error alanında KURUM_NOT_FOUND kontrolü
          if (errorData?.data?.error === 'KURUM_NOT_FOUND' || 
              errorData?.error === 'KURUM_NOT_FOUND' ||
              errorData?.data?.error === 'kurum_not_found' ||
              errorData?.error === 'kurum_not_found') {
            // Detaylı hata mesajı oluştur
            const errorMessage = errorData?.message || 'Kurum bulunamadı';
            const availableKurumlar = errorData?.data?.available_kurumlar || [];
            let fullMessage = errorMessage;
            if (availableKurumlar.length > 0) {
              const kurumListesi = availableKurumlar.map((k: any) => k.kurum_adi || k.kurum_adi).join(', ');
              fullMessage += `\n\nMevcut kurumlar: ${kurumListesi}`;
            }
            const error = new Error(fullMessage);
            (error as any).errorData = errorData;
            throw error;
          }
          
          // JSON'dan hata mesajını al
          const errorMessage = errorData?.message || errorData?.error || errorData?.detail || errorData?.msg || '';
          const lowerMessage = errorMessage.toLowerCase();
          
          // Kurum bulunamadı kontrolü (mesaj içinde)
          if ((lowerMessage.includes('kurum') && (lowerMessage.includes('bulunamadı') || lowerMessage.includes('bulunamadi') || lowerMessage.includes('not found') || lowerMessage.includes('not_found'))) ||
              lowerMessage.includes('kurum bulunamadı') ||
              lowerMessage.includes('kurum not found') ||
              lowerMessage.includes('kurumlar.json dosyasında bulunamadı')) {
            throw new Error('Kurum bulunamadı');
          }
          
          // Eğer mesaj varsa onu göster, yoksa genel mesaj
          throw new Error(errorMessage || 'Sunucu hatası oluştu');
        } catch (parseError) {
          // JSON parse hatası veya zaten Error throw edildi
          if (parseError instanceof Error) {
            throw parseError;
          }
          throw new Error('Sunucu hatası oluştu');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function getKurumlar(limit: number = 1000, offset: number = 0): Promise<KurumlarResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/kurumlar?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: headers,
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
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export interface EdevletScrapeItem {
  baslik: string;
  aciklama: string;
  url: string;
  kurum_id: string;
  created_at: string;
}

export interface EdevletScrapeResponse {
  success: boolean;
  inserted_count: number;
  data: EdevletScrapeItem[];
}

export interface EdevletScrapeError {
  detail: string;
}

export async function scrapeEdevlet(kurumId: string, url: string): Promise<EdevletScrapeResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/edevlet/scrape`,
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          kurum_id: kurumId,
          url: url
        }),
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
      
      // 400 Bad Request hataları
      if (response.status === 400) {
        try {
          const errorData: EdevletScrapeError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      
      // 500 Internal Server Error
      if (response.status === 500) {
        try {
          const errorData: EdevletScrapeError = await response.json();
          throw new Error(errorData.detail || 'Sunucu hatası oluştu');
        } catch {
          throw new Error('Sunucu hatası oluştu');
        }
      }
      
      // 502 Bad Gateway
      if (response.status === 502) {
        try {
          const errorData: EdevletScrapeError = await response.json();
          throw new Error(errorData.detail || 'Gateway hatası');
        } catch {
          throw new Error('Gateway hatası');
        }
      }
      
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export interface Link {
  _id: string;
  baslik: string;
  aciklama?: string;
  url: string;
  kurum_id: string;
  created_at: string;
}

export interface LinksResponse {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  data: Link[];
}

export interface LinkResponse {
  success: boolean;
  data?: Link;
  id?: string;
  modified?: number;
  deleted?: number;
  deleted_count?: number;
  message?: string;
}

export interface LinkError {
  detail: string;
}

export async function getLinks(limit: number = 100, offset: number = 0): Promise<LinksResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/links?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: headers,
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
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function getLink(id: string): Promise<LinkResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/links/${id}`,
      {
        method: 'GET',
        headers: headers,
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
      if (response.status === 404) {
        try {
          const errorData: LinkError = await response.json();
          throw new Error(errorData.detail || 'Kayıt bulunamadı');
        } catch {
          throw new Error('Kayıt bulunamadı');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function createLink(data: {
  baslik: string;
  aciklama?: string;
  url: string;
  kurum_id: string;
}): Promise<LinkResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/links`,
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data),
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
      if (response.status === 400) {
        try {
          const errorData: LinkError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function updateLink(id: string, data: {
  baslik?: string;
  aciklama?: string;
  url?: string;
  kurum_id?: string;
}): Promise<LinkResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/links/${id}`,
      {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(data),
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
      if (response.status === 400 || response.status === 404) {
        try {
          const errorData: LinkError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function deleteLink(id: string): Promise<LinkResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/links/${id}`,
      {
        method: 'DELETE',
        headers: headers,
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
      if (response.status === 400 || response.status === 404) {
        try {
          const errorData: LinkError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export interface DeleteLinksByKurumResponse {
  success: boolean;
  deleted_count: number;
}

export async function deleteLinksByKurum(kurumId: string): Promise<DeleteLinksByKurumResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/links/by-kurum/${kurumId}`,
      {
        method: 'DELETE',
        headers: headers,
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
      if (response.status === 400) {
        try {
          const errorData: LinkError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      if (response.status === 500) {
        try {
          const errorData: LinkError = await response.json();
          throw new Error(errorData.detail || 'Sunucu hatası oluştu');
        } catch {
          throw new Error('Sunucu hatası oluştu');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export interface KurumResponse {
  success: boolean;
  data?: Kurum;
  id?: string;
  modified?: number;
  deleted?: number;
  logo_url?: string | null;
  message?: string;
}

export interface KurumError {
  detail: string;
}

export async function getKurum(id: string): Promise<KurumResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/kurumlar/${id}`,
      {
        method: 'GET',
        headers: headers,
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
      if (response.status === 400 || response.status === 404) {
        try {
          const errorData: KurumError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function createKurum(data: {
  kurum_adi: string;
  aciklama?: string;
  detsis?: string;
  logo?: File | null;
}): Promise<KurumResponse> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;
    
    if (!token) {
      throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
    }

    const formData = new FormData();
    formData.append('kurum_adi', data.kurum_adi);
    if (data.aciklama !== undefined) {
      formData.append('aciklama', data.aciklama || '');
    }
    if (data.detsis !== undefined) {
      formData.append('detsis', data.detsis || '');
    }
    if (data.logo) {
      formData.append('logo', data.logo);
    }
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/kurumlar`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
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
      if (response.status === 400 || response.status === 500) {
        try {
          const errorData: KurumError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function updateKurum(id: string, data: {
  kurum_adi?: string;
  aciklama?: string;
  detsis?: string;
  logo?: File | null;
}): Promise<KurumResponse> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;
    
    if (!token) {
      throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
    }

    const formData = new FormData();
    if (data.kurum_adi) {
      formData.append('kurum_adi', data.kurum_adi);
    }
    if (data.aciklama !== undefined) {
      formData.append('aciklama', data.aciklama || '');
    }
    // detsis alanını her zaman gönder (undefined değilse, boş string olsa bile)
    // Bu sayede detsis alanı güncellenebilir veya temizlenebilir
    if (data.detsis !== undefined) {
      formData.append('detsis', String(data.detsis || ''));
    }
    if (data.logo) {
      formData.append('logo', data.logo);
    }
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/kurumlar/${id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
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
      if (response.status === 400 || response.status === 404 || response.status === 500) {
        try {
          const errorData: KurumError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function deleteKurum(id: string): Promise<KurumResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/kurumlar/${id}`,
      {
        method: 'DELETE',
        headers: headers,
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
      if (response.status === 400 || response.status === 404) {
        try {
          const errorData: KurumError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export interface KurumDuyuru {
  _id: string;
  kurum_id: string;
  duyuru_linki: string;
  olusturulma_tarihi?: string;
}

export interface KurumDuyurularResponse {
  success: boolean;
  total?: number;
  limit?: number;
  offset?: number;
  data: KurumDuyuru[];
}

export interface KurumDuyuruResponse {
  success: boolean;
  data?: KurumDuyuru;
  id?: string;
  modified?: number;
  deleted?: number;
  message?: string;
}

export interface KurumDuyuruError {
  detail: string;
}

export async function getKurumDuyurular(limit: number = 100, offset: number = 0): Promise<KurumDuyurularResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/kurum-duyuru?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: headers,
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
      if (response.status === 500) {
        try {
          const errorData: KurumDuyuruError = await response.json();
          throw new Error(errorData.detail || 'Sunucu hatası oluştu');
        } catch {
          throw new Error('Sunucu hatası oluştu');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function getKurumDuyuru(id: string): Promise<KurumDuyuruResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/kurum-duyuru/${id}`,
      {
        method: 'GET',
        headers: headers,
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
      if (response.status === 400 || response.status === 404) {
        try {
          const errorData: KurumDuyuruError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function createKurumDuyuru(data: {
  kurum_id: string;
  duyuru_linki: string;
}): Promise<KurumDuyuruResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/kurum-duyuru`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
      if (response.status === 400) {
        try {
          const errorData: KurumDuyuruError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function updateKurumDuyuru(id: string, data: {
  kurum_id?: string;
  duyuru_linki?: string;
}): Promise<KurumDuyuruResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/kurum-duyuru/${id}`,
      {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
      if (response.status === 400 || response.status === 404) {
        try {
          const errorData: KurumDuyuruError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function deleteKurumDuyuru(id: string): Promise<KurumDuyuruResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/kurum-duyuru/${id}`,
      {
        method: 'DELETE',
        headers: headers,
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
      if (response.status === 400 || response.status === 404) {
        try {
          const errorData: KurumDuyuruError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export interface Metadata {
  _id: string;
  pdf_adi?: string;
  kurum_id?: string;
  belge_turu?: string;
  belge_durumu?: string;
  belge_yayin_tarihi?: string;
  yururluluk_tarihi?: string;
  etiketler?: string;
  anahtar_kelimeler?: string;
  aciklama?: string;
  url_slug?: string;
  status?: string;
  sayfa_sayisi?: number;
  dosya_boyutu_mb?: number;
  yukleme_tarihi?: string;
  olusturulma_tarihi?: string;
  pdf_url?: string;
  [key: string]: any;
}

export interface MetadataListResponse {
  success: boolean;
  total?: number;
  limit?: number;
  offset?: number;
  data: Metadata[];
}

export interface MetadataResponse {
  success: boolean;
  data?: Metadata;
  modified?: number;
  message?: string;
}

export interface MetadataError {
  detail: string;
}

export interface DeleteMetadataResponse {
  success: boolean;
  message: string;
  deleted: {
    metadata: number;
    content: number;
    bunny_pdf: boolean;
  };
}

export interface Content {
  _id: string;
  metadata_id: string;
  icerik: string;
  olusturulma_tarihi?: string;
}

export interface ContentResponse {
  success: boolean;
  data?: Content;
  modified?: number;
}

export interface ContentError {
  detail: string;
}

export async function getMetadataList(limit: number = 100, offset: number = 0): Promise<MetadataListResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/metadata?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: headers,
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
      if (response.status === 500) {
        try {
          const errorData: MetadataError = await response.json();
          throw new Error(errorData.detail || 'Sunucu hatası oluştu');
        } catch {
          throw new Error('Sunucu hatası oluştu');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function getMetadata(id: string): Promise<MetadataResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/metadata/${id}`,
      {
        method: 'GET',
        headers: headers,
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
      if (response.status === 400 || response.status === 404) {
        try {
          const errorData: MetadataError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function updateMetadata(id: string, data: Partial<Metadata>): Promise<MetadataResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/metadata/${id}`,
      {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
      if (response.status === 400 || response.status === 404) {
        try {
          const errorData: MetadataError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function getContentByMetadata(metadataId: string): Promise<ContentResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/content/by-metadata/${metadataId}`,
      {
        method: 'GET',
        headers: headers,
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
      if (response.status === 400 || response.status === 404) {
        try {
          const errorData: ContentError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function deleteMetadata(id: string): Promise<DeleteMetadataResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/metadata/${id}`,
      {
        method: 'DELETE',
        headers: headers,
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
      if (response.status === 400 || response.status === 404) {
        try {
          const errorData: MetadataError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      if (response.status === 500) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Sunucu hatası oluştu');
        } catch {
          throw new Error('Sunucu hatası oluştu');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function updateContentByMetadata(metadataId: string, icerik: string): Promise<ContentResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/content/by-metadata/${metadataId}`,
      {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ icerik }),
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
      if (response.status === 400 || response.status === 404) {
        try {
          const errorData: ContentError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export interface HealthResponse {
  status: string;
  service: string;
}

export interface DetailedHealthResponse {
  status: string;
  service: string;
  timestamp: string;
  checks: {
    mongodb?: {
      status: string;
      message: string;
    };
    systemd_service?: {
      status: string;
      message: string;
      service_name: string;
    };
    curl_cffi?: {
      status: string;
      message: string;
    };
  };
  system?: {
    platform: string;
    platform_release: string;
    python_version: string;
  };
}

export interface HealthLogsResponse {
  success: boolean;
  service_name: string;
  lines_requested: number;
  lines_returned: number;
  timestamp: string;
  logs: string[];
  raw_logs: string;
}

export interface HealthStatusResponse {
  success: boolean;
  service_name: string;
  timestamp: string;
  status_output: string;
  details: {
    ActiveState?: string;
    SubState?: string;
    LoadState?: string;
    MainPID?: string;
    ExecMainStartTimestamp?: string;
  };
}

export async function getHealth(): Promise<HealthResponse> {
  try {
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/health`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function getDetailedHealth(): Promise<DetailedHealthResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/health`,
      {
        method: 'GET',
        headers: headers,
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
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function getHealthLogs(lines: number = 100): Promise<HealthLogsResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/health/logs?lines=${lines}`,
      {
        method: 'GET',
        headers: headers,
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
      if (response.status === 500) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Sunucu hatası oluştu');
        } catch {
          throw new Error('Sunucu hatası oluştu');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function getHealthStatus(): Promise<HealthStatusResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/health/status`,
      {
        method: 'GET',
        headers: headers,
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
      if (response.status === 500) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Sunucu hatası oluştu');
        } catch {
          throw new Error('Sunucu hatası oluştu');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export interface MevzuatGPTScanItem {
  id: number;
  mevzuatgpt: boolean;
  portal: boolean;
  baslik: string;
  link: string;
}

export interface MevzuatGPTScanSection {
  section_title: string;
  items_count: number;
  items: MevzuatGPTScanItem[];
}

export interface MevzuatGPTSectionStats {
  section_title: string;
  total: number;
  uploaded: number;
  not_uploaded: number;
}

export interface MevzuatGPTScanResponse {
  success: boolean;
  message: string;
  data: {
    total_sections: number;
    total_items: number;
    uploaded_documents_count: number;
    sections: MevzuatGPTScanSection[];
    sections_stats: MevzuatGPTSectionStats[];
  };
}

export interface MevzuatGPTScanError {
  error: string;
  kurum_id?: string;
  available_kurumlar?: Array<{ id: string; kurum_adi: string }>;
  details?: string;
}

export async function getMevzuatGPTScan(kurumId: string, detsis?: string, type?: string): Promise<MevzuatGPTScanResponse> {
  try {
    const headers = getAuthHeaders();
    
    const requestBody: any = {
      id: kurumId
    };
    
    if (detsis !== undefined) {
      requestBody.detsis = detsis;
    }
    
    if (type !== undefined) {
      requestBody.type = type;
    }
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mevzuatgpt/scrape`,
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
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
    
    // Response başarısız olsa bile 200 OK dönebilir, kontrol et
    if (!result.success) {
      // Kurum bulunamadı hatası
      if (result.data?.error === 'KURUM_NOT_FOUND') {
        throw new Error(result.message || 'Kurum bulunamadı');
      }
      // Diğer hatalar
      throw new Error(result.message || 'Tarama işlemi başarısız oldu');
    }
    
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export interface ProcessDocumentRequest {
  kurum_id: string;
  link: string;
  mode: "m" | "p" | "t";
  category?: string;
  document_name?: string;
  detsis?: string;
  type?: string;
  use_ocr?: boolean | null;
}

export interface ProcessDocumentResponse {
  success: boolean;
  message: string;
  data: {
    category: string;
    institution: string;
    document_name: string;
    output_dir: string | null;
    sections_count: number;
    upload_response: {
      success: boolean;
      uploaded_count: number;
      failed_count: number;
    } | null;
  };
}

export async function processDocument(data: ProcessDocumentRequest): Promise<ProcessDocumentResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/kurum/process`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    // Önce response body'yi text olarak al (hem hata hem başarı durumunda kullanabilmek için)
    const responseText = await response.text();
    
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
      
      // Detaylı hata mesajı al
      let errorMessage = `API Hatası: ${response.status} - ${response.statusText}`;
      let errorDetails = "";
      
      if (responseText) {
        try {
          const errorData = JSON.parse(responseText);
          // Farklı hata formatlarını kontrol et
          if (errorData.detail) {
            errorMessage = errorData.detail;
            errorDetails = JSON.stringify(errorData, null, 2);
          } else if (errorData.message) {
            errorMessage = errorData.message;
            errorDetails = JSON.stringify(errorData, null, 2);
          } else if (errorData.error) {
            errorMessage = errorData.error;
            errorDetails = JSON.stringify(errorData, null, 2);
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else {
            errorMessage = `Sunucu hatası (${response.status})`;
            errorDetails = JSON.stringify(errorData, null, 2);
          }
        } catch (parseError) {
          // JSON parse edilemezse raw text'i kullan
          errorMessage = `Sunucu hatası (${response.status}): ${responseText}`;
          errorDetails = responseText;
        }
      }
      
      // Detaylı hata mesajı oluştur
      const fullErrorMessage = errorDetails 
        ? `${errorMessage}\n\nDetaylar:\n${errorDetails}`
        : errorMessage;
      
      throw new Error(fullErrorMessage);
    }

    // Başarılı yanıtı parse et
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Yanıt parse edilemedi: ${responseText}`);
    }
    
    // Response başarısız olsa bile 200 OK dönebilir, kontrol et
    if (!result.success) {
      const errorMsg = result.message || result.detail || result.error || 'İşlem başarısız oldu';
      const errorDetails = JSON.stringify(result, null, 2);
      throw new Error(`${errorMsg}\n\nDetaylar:\n${errorDetails}`);
    }
    
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

// Proxy CRUD Interfaces
export interface Proxy {
  id: string;
  host: string;
  port: string;
  username?: string;
  password?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProxyListResponse {
  success: boolean;
  total: number;
  data: Proxy[];
}

export interface ProxyResponse {
  success: boolean;
  data?: Proxy;
  id?: string;
  modified?: number;
  deleted?: number;
  message?: string;
}

export interface ProxyError {
  detail: string;
}

// Proxy CRUD Functions
export async function getProxies(limit: number = 100, offset: number = 0): Promise<ProxyListResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/proxies?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: headers,
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
      if (response.status === 500) {
        try {
          const errorData: ProxyError = await response.json();
          throw new Error(errorData.detail || 'Sunucu hatası oluştu');
        } catch {
          throw new Error('Sunucu hatası oluştu');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function getProxy(id: string): Promise<ProxyResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/proxies/${id}`,
      {
        method: 'GET',
        headers: headers,
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
      if (response.status === 400 || response.status === 404) {
        try {
          const errorData: ProxyError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function createProxy(data: {
  host: string;
  port: string;
  username?: string;
  password?: string;
  is_active?: boolean;
}): Promise<ProxyResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/proxies`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
      if (response.status === 400) {
        try {
          const errorData: ProxyError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function updateProxy(id: string, data: {
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  is_active?: boolean;
}): Promise<ProxyResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/proxies/${id}`,
      {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
      if (response.status === 400 || response.status === 404) {
        try {
          const errorData: ProxyError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export async function deleteProxy(id: string): Promise<ProxyResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/proxies/${id}`,
      {
        method: 'DELETE',
        headers: headers,
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
      if (response.status === 400 || response.status === 404) {
        try {
          const errorData: ProxyError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

export interface ProxyTestRequest {
  id: string;
  detsis?: string;
}

export interface ProxyTestResponse {
  success: boolean;
  proxy_id: string;
  proxy_host: string;
  proxy_port: string;
  test_url: string;
  detsis: string;
  ip_info: {
    ip: string;
    country: string;
    country_code: string;
    city: string;
    is_turkey: boolean;
  };
  connection_status: string;
  http_status?: number;
  response_size?: number;
  content_check?: string;
  error?: string | null;
  curl_cffi_available: boolean;
}

export async function testProxy(data: ProxyTestRequest): Promise<ProxyTestResponse> {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(
      `${API_CONFIG.SCRAPPER_BASE_URL}/api/mongo/proxies/test`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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
      if (response.status === 400 || response.status === 404) {
        try {
          const errorData: ProxyError = await response.json();
          throw new Error(errorData.detail || 'Geçersiz istek');
        } catch {
          throw new Error('Geçersiz istek');
        }
      }
      throw new Error(`API Hatası: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Scrapper API sunucusuna bağlanılamıyor. Lütfen bağlantıyı kontrol edin.');
    }
    throw error;
  }
}

