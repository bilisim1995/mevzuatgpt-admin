import { STORAGE_KEYS, API_CONFIG } from '@/constants/api';

export interface BulkUploadRequest {
  files: File[];
  metadata: string; // JSON string
  category: string;
  institution: string;
  belge_adi: string;
}

export interface BulkUploadResponse {
  success: boolean;
  timestamp: string;
  data: {
    batch_id: string;
    total_files: number;
    tasks: Array<{
      task_id: string;
      document_id: string;
      filename: string;
      status: 'queued' | 'processing' | 'completed' | 'failed';
    }>;
  };
  message: string;
}

export interface TaskProgress {
  task_id: string;
  document_id: number;
  filename: string;
  document_title: string | null;
  batch_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: {
    current_step: string;
    total_steps: number;
    percentage: number;
  };
  created_at: string;
  updated_at: string;
  completed_at?: string;
  failed_at?: string;
  error?: string;
}

export interface TaskProgressResponse {
  status: string;
  data: TaskProgress;
}

export interface BatchProgress {
  batch_id: string;
  total_files: number;
  completed_count: number;
  failed_count: number;
  queued_count: number;
  processing_count: number;
  batch_status: 'processing' | 'completed';
  created_at: string;
  tasks: Array<{
    task_id: string;
    document_id: number;
    filename: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    error?: string;
  }>;
}

export interface BatchProgressResponse {
  status: string;
  data: BatchProgress;
}

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;
  
  if (!token) {
    throw new Error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
  }

  return {
    'Authorization': `Bearer ${token}`,
  };
}

export async function bulkUploadDocuments(request: BulkUploadRequest): Promise<BulkUploadResponse> {
  try {
    console.log('Bulk upload request:', {
      files: request.files.length,
      category: request.category,
      institution: request.institution,
      belge_adi: request.belge_adi,
      metadata: request.metadata
    });
    
    const formData = new FormData();
    
    // Add files - her dosya için ayrı 'files' field'ı
    request.files.forEach((file) => {
      formData.append('files', file);
    });
    
    // Required fields - API'de zorunlu alanlar
    formData.append('category', request.category);
    formData.append('institution', request.institution);
    formData.append('belge_adi', request.belge_adi);
    
    console.log('FormData entries:');
    // TODO: FormData entries iteration düzeltilecek
    // for (const [key, value] of formData.entries()) {
    //   console.log(`${key}:`, value);
    // }
    
    // Metadata - JSON string olarak gönder
    if (request.metadata) {
      formData.append('metadata', request.metadata);
    } else {
      // Eğer metadata yoksa, default metadata oluştur
      const defaultMetadata = {
        pdf_sections: request.files.map(file => ({
          output_filename: file.name,
          title: file.name.replace('.pdf', ''),
          description: `${request.belge_adi} - ${file.name}`,
          keywords: `${request.category}, ${request.institution}`
        }))
      };
      formData.append('metadata', JSON.stringify(defaultMetadata));
    }

    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/documents/bulk-upload`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
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
      
      // Hata detaylarını al
      const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen hata' }));
      
      // 422 - Required field eksik
      if (response.status === 422) {
        const missingFields = errorData.detail?.map((d: any) => d.loc.join('.')).join(', ') || 'bilinmeyen alanlar';
        throw new Error(`Eksik alanlar: ${missingFields}`);
      }
      
      // 400 - Diğer hatalar
      if (response.status === 400) {
        throw new Error(errorData.message || 'Geçersiz dosya veya metadata formatı');
      }
      
      throw new Error(errorData.message || `Toplu yükleme sırasında hata oluştu: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function getTaskProgress(taskId: string): Promise<TaskProgressResponse> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/documents/bulk-upload/progress/${taskId}`,
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
      
      if (response.status === 404) {
        throw new Error('Task bulunamadı veya süresi dolmuş');
      }
      
      const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen hata' }));
      throw new Error(errorData.message || `Progress alınırken hata oluştu: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export async function getBatchProgress(batchId: string): Promise<BatchProgressResponse> {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/documents/bulk-upload/batch/${batchId}/progress`,
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
      
      if (response.status === 404) {
        throw new Error('Batch bulunamadı veya süresi dolmuş');
      }
      
      const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen hata' }));
      throw new Error(errorData.message || `Batch progress alınırken hata oluştu: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

