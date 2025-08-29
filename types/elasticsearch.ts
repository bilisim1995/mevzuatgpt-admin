export interface ElasticsearchClusterHealth {
  health: string;
  cluster_status: 'green' | 'yellow' | 'red';
  cluster_name: string;
  vector_dimensions: number;
  document_count: number;
}

export interface ElasticsearchClusterInfo {
  total_nodes: number;
  data_nodes: number;
  indices_count: number;
  total_shards: number;
  docs_count: number;
  store_size: number;
}

export interface ElasticsearchIndexInfo {
  index_name: string;
  total_docs: number;
  deleted_docs: number;
  store_size_bytes: number;
  store_size_human: string;
}

export interface InstitutionBreakdown {
  name: string;
  chunk_count: number;
}

export interface ElasticsearchDocumentBreakdown {
  unique_documents: number;
  total_chunks: number;
  institutions: InstitutionBreakdown[];
}

export interface ElasticsearchStatus {
  connection: 'healthy' | 'error';
  cluster_health: ElasticsearchClusterHealth;
  cluster_info: ElasticsearchClusterInfo;
  index_info: ElasticsearchIndexInfo;
  document_breakdown: ElasticsearchDocumentBreakdown;
  timestamp: string;
}

export interface ElasticsearchStatusResponse {
  success: boolean;
  data: ElasticsearchStatus;
}

export interface ElasticsearchClearAllResponse {
  success: boolean;
  message: string;
  data: {
    docs_before: number;
    docs_deleted: number;
    docs_after: number;
    index_name: string;
    timestamp: string;
  };
}

export interface ElasticsearchClearDocumentResponse {
  success: boolean;
  message: string;
  data: {
    document_id: string;
    vectors_before: number;
    chunks_before: number;
    vectors_deleted: number;
    vectors_after: number;
    index_name: string;
    timestamp: string;
  };
}

export interface ElasticsearchClearDocumentsResult {
  document_id: string;
  vectors_deleted: number;
  vectors_before: number;
  status: 'success' | 'error';
  error?: string;
}

export interface ElasticsearchClearDocumentsResponse {
  success: boolean;
  message: string;
  data: {
    total_documents: number;
    total_vectors_deleted: number;
    results: ElasticsearchClearDocumentsResult[];
    index_name: string;
    timestamp: string;
  };
}