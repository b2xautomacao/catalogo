export type AIProviderType = "openai" | "gemini" | "anthropic" | "custom";

export interface AIProviderConfig {
  id: string;
  name: string;
  type: AIProviderType;
  is_active: boolean;
  api_key?: string;
  api_endpoint?: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  created_at: string;
  updated_at: string;
}

export interface OpenAIConfig {
  api_key: string;
  model: string;
  max_tokens: number;
  temperature: number;
}

export interface GeminiConfig {
  api_key: string;
  model: string;
  max_tokens: number;
  temperature: number;
}

export interface AnthropicConfig {
  api_key: string;
  model: string;
  max_tokens: number;
  temperature: number;
}

export interface CustomAIConfig {
  api_key: string;
  api_endpoint: string;
  model: string;
  max_tokens: number;
  temperature: number;
}

export interface AIProviderSettings {
  store_id: string; // Changed from UUID to string to support "global"
  default_provider: AIProviderType;
  openai_config?: OpenAIConfig;
  gemini_config?: GeminiConfig;
  anthropic_config?: AnthropicConfig;
  custom_ai_config?: CustomAIConfig;
  created_at: string;
  updated_at: string;
}

export interface AIRequestOptions {
  provider: AIProviderType;
  prompt: string;
  model?: string;
  max_tokens?: number;
  temperature?: number;
  system_message?: string;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  provider: AIProviderType;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
