export interface DocumentUpload {
  title: string;
  category: string;
  description: string;
  keywords: string;
  source_institution: string;
  belge_adi?: string;
  file: File;
}

export interface Document {
  id: string;
  title: string;
  filename: string;
  file_url: string;
  category: string;
  processing_status: 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at?: string;
  uploaded_by?: string;
  file_size: number;
  description?: string;
  keywords?: string;
  institution?: string;
  belge_adi?: string;
  document_title?: string;
  has_error?: boolean;
}

export interface DocumentsResponse {
  documents: Document[];
  total_count: number;
  has_more: boolean;
  page: number;
  limit: number;
}

export interface DocumentCategory {
  value: string;
  label: string;
}