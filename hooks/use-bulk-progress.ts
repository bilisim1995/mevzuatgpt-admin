"use client"

import { useState, useEffect } from 'react';
import { STORAGE_KEYS, API_CONFIG } from '@/constants/api';
import { getTaskProgress, getBatchProgress, TaskProgress, BatchProgress } from '@/lib/bulk-upload';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;
  
  if (!token) {
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

export const useBulkUploadProgress = (taskId: string | null) => {
  const [progress, setProgress] = useState<TaskProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) {
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        const response = await getTaskProgress(taskId);
        
        if (response.status === 'success' && response.data) {
          setProgress(response.data);
          setLoading(false);
          
          // Tamamlandığında veya hata olduğunda durdur
          if (response.data.status === 'completed' || response.data.status === 'failed') {
            return; // interval'ı durdur
          }
        }
      } catch (error) {
        console.error('Bulk progress fetch error:', error);
        setLoading(false);
      }
    };

    // İlk çağrı
    fetchProgress();

    // Her 2 saniyede bir kontrol et
    const interval = setInterval(fetchProgress, 2000);

    return () => clearInterval(interval);
  }, [taskId]);

  return { progress, loading };
};

export const useActiveBulkTasks = () => {
  const [activeTasks, setActiveTasks] = useState<TaskProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveTasks = async () => {
      try {
        // Bu endpoint henüz mevcut değil, şimdilik boş array döndür
        // TODO: API'den aktif bulk task'ları al
        setActiveTasks([]);
        setLoading(false);
      } catch (error) {
        console.error('Active bulk tasks fetch error:', error);
        setLoading(false);
      }
    };

    // İlk çağrı
    fetchActiveTasks();
    
    // Her 2 saniyede bir kontrol et
    const interval = setInterval(fetchActiveTasks, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return { activeTasks, loading };
};

// Bulk task temizleme fonksiyonu
export const clearBulkTaskProgress = async (taskId: string): Promise<void> => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/admin/documents/bulk-upload/progress/${taskId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders()
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
      throw new Error('Bulk task temizlenirken hata oluştu');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Bulk task temizlenirken hata oluştu');
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
};
