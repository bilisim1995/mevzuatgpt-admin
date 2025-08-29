import { DocumentUpload, Document, DocumentsResponse } from '@/types/document';
import { STORAGE_KEYS, API_CONFIG } from '@/constants/api';
import { MESSAGES } from '@/constants/messages';

export async function uploadDocument(documentData: DocumentUpload): Promise<{ task_id?: string; data?: Document; [key: string]: any }> {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  
  if (!token) {
    throw new Error('Token bulunamadı');
  }

  const formData = new FormData();
  formData.append('title', documentData.title);
  formData.append('category', documentData.category);
  formData.append('description', documentData.description);
  formData.append('keywords', documentData.keywords);
  formData.append('source_institution', documentData.source_institution);
  formData.append('file', documentData.file);

  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD_DOCUMENT}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: MESSAGES.DOCUMENTS.UPLOAD_ERROR }));
    throw new Error(error.message || MESSAGES.DOCUMENTS.UPLOAD_ERROR);
  }

  const result = await response.json();
  
  // API response yapısını kontrol et
  if (result.success && result.data) {
    return result.data;
  } else if (result.task_id) {
    // Direct response with task_id
    return result;
  } else {
    return result.data || result;
  }
}

export async function getDocuments(
  page: number = 1,
  limit: number = 20,
  category?: string,
  status?: string
): Promise<DocumentsResponse> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;
  
  if (!token) {
    throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
  }

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (category) params.append('category', category);
  if (status) params.append('status', status);

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCUMENTS}?${params}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      },
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
    
    // Check if result has the expected structure
    if (!result.success || !result.data) {
      throw new Error('API yanıt formatı beklenenden farklı');
    }

    // Transform API response to frontend format
    const transformedResponse = {
      documents: (result.data.documents || []).map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        filename: doc.filename,
        file_url: doc.bunny_url || '',
        category: doc.category,
        processing_status: doc.processing_status,
        created_at: doc.created_at,
        file_size: doc.file_size_mb ? Math.round(doc.file_size_mb * 1024 * 1024) : 0,
        description: doc.preview || '',
        keywords: doc.keywords || '',
        institution: doc.institution || doc.source_institution || '',
        has_error: doc.has_error || false,
        // Yeni alanlar
        updated_at: doc.updated_at,
        uploaded_by: doc.uploaded_by
      })),
      total_count: result.data.pagination.total || 0,
      has_more: result.data.pagination.has_next || false,
      page: result.data.pagination.page || page,
      limit: limit
    };

    return transformedResponse;

  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function getDocumentDetails(documentId: string): Promise<any> {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  
  if (!token) {
    throw new Error('Token bulunamadı');
  }

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCUMENTS}/${documentId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Doküman detayları alınırken hata oluştu');
  }

  const result = await response.json();
  return result.data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  
  if (!token) {
    throw new Error('Token bulunamadı');
  }

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCUMENTS}/${documentId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(MESSAGES.DOCUMENTS.DELETE_ERROR);
  }
}

export async function reprocessDocument(documentId: string): Promise<void> {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  
  if (!token) {
    throw new Error('Token bulunamadı');
  }

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOCUMENTS}/${documentId}/reprocess`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Doküman yeniden işlenirken hata oluştu');
  }
}