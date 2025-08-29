export interface GroqSettings {
  default_model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  available_models: string[];
  creativity_mode: 'conservative' | 'balanced' | 'creative' | 'highly_creative';
  response_style: 'concise' | 'detailed' | 'analytical' | 'conversational';
}

export interface GroqSettingsResponse {
  success: boolean;
  data: GroqSettings;
}

export interface GroqModel {
  id: string;
  model_name: string;
  name: string;
  description: string;
  context_length: number;
  performance_tier: string;
  best_use_cases: string[];
  is_available: boolean;
}

export interface GroqModelsResponse {
  success: boolean;
  data: {
    models: GroqModel[];
    current_default?: string;
    total_count: number;
  };
}

export interface GroqCreativityPreset {
  name: string;
  label: string;
  description: string;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

export interface GroqCreativityPresetsResponse {
  success: boolean;
  data: Record<string, GroqCreativityPreset>;
}

export interface GroqStatus {
  service_status: 'healthy' | 'warning' | 'error';
  response_time_ms: number;
  available_models: string[];
  current_model: string;
  model_count: number;
  current_settings?: GroqSettings;
  last_check: string;
  error?: string;
}

export interface GroqStatusResponse {
  success: boolean;
  data: GroqStatus;
}

export interface GroqTestResult {
  success: boolean;
  response: string;
  performance_metrics: {
    response_time_ms: number;
    tokens_used: number;
    model_used: string;
  };
  settings_used: GroqSettings;
}

export interface GroqTestResponse {
  success: boolean;
  data: GroqTestResult;
}

export interface GroqResetResponse {
  success: boolean;
  message: string;
  data: GroqSettings;
}