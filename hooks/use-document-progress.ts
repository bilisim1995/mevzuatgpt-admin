"use client"

import { useState, useEffect } from 'react';
import { STORAGE_KEYS, API_CONFIG } from '@/constants/api';

export interface DocumentProgress {
  task_id: string;
  document_id?: string;
  document_title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage: 'upload' | 'download' | 'extract' | 'chunk' | 'embed' | 'storage';
  progress_percent: number;
  current_step: string;
  error_message?: string;
  total_steps?: number;
  completed_steps?: number;
  estimated_remaining_seconds?: number;
}

export interface SpecificProgressResponse {
  success: boolean;
  task_id: string;
  progress: {
    progress_percent: number;
    current_step: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    stage: 'upload' | 'download' | 'extract' | 'chunk' | 'embed' | 'storage';
  };
}

export interface ActiveTasksResponse {
  success: boolean;
  data: {
    active_tasks: DocumentProgress[];
    count: number;
  };
}

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

export const useDocumentProgress = (taskId: string | null) => {
  const [progress, setProgress] = useState<DocumentProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) {
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/progress/${taskId}`, {
          method: 'GET',
          headers: getAuthHeaders()
        });
        
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
          console.error('Progress API error:', response.status);
          setLoading(false);
          return;
        }

        const data: SpecificProgressResponse = await response.json();
        
        if (data.success && data.progress) {
          // Transform API response to our format
          const transformedProgress: DocumentProgress = {
            task_id: data.task_id,
            document_title: progress?.document_title || 'Bilinmeyen Doküman',
            status: data.progress.status,
            stage: data.progress.stage,
            progress_percent: data.progress.progress_percent,
            current_step: data.progress.current_step,
            total_steps: 6, // upload, download, extract, chunk, embed, storage
            completed_steps: Math.floor((data.progress.progress_percent / 100) * 6)
          };
          
          setProgress(transformedProgress);
          setLoading(false);
          
          // Tamamlandığında veya hata olduğunda durdur
          if (transformedProgress.status === 'completed' || transformedProgress.status === 'failed') {
            return; // interval'ı durdur
          }
        }
      } catch (error) {
        console.error('Progress fetch error:', error);
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

export const useActiveTasks = () => {
  const [activeTasks, setActiveTasks] = useState<DocumentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveTasks = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/progress`, {
          method: 'GET',
          headers: getAuthHeaders()
        });
        
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
          console.error('Active tasks API error:', response.status);
          setLoading(false);
          return;
        }

        const data: ActiveTasksResponse = await response.json();
        
        if (data.success && data.data) {
          setActiveTasks(data.data.active_tasks || []);
        }
      } catch (error) {
        console.error('Active tasks fetch error:', error);
      } finally {
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

// Task temizleme fonksiyonu
export const clearTaskProgress = async (taskId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/progress/${taskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

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
      throw new Error('Task temizlenirken hata oluştu');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Task temizlenirken hata oluştu');
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('API sunucusuna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
};