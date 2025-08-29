export interface Prompt {
  id: string;
  provider: 'groq' | 'openai' | 'anthropic';
  prompt_type: 'system' | 'user' | 'assistant';
  prompt_content: string;
  description: string;
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  usage_count?: number;
}

export interface PromptsResponse {
  prompts: Prompt[];
  total_count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface PromptCreateData {
  provider: 'groq' | 'openai' | 'anthropic';
  prompt_type: 'system' | 'user' | 'assistant';
  prompt_content: string;
  description: string;
  version: string;
  is_active: boolean;
}

export interface PromptUpdateData {
  prompt_content?: string;
  description?: string;
  version?: string;
  is_active?: boolean;
}

export interface PromptFilters {
  page?: number;
  limit?: number;
  provider?: 'groq' | 'openai' | 'anthropic';
  prompt_type?: 'system' | 'user' | 'assistant';
  is_active?: boolean;
  search?: string;
}