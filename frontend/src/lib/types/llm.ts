export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: ChatCompletionUsage;
}

export interface ModelInfo {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
  permission: any[];
  root: string | null;
  parent: string | null;
}

export interface ModelsResponse {
  object: 'list';
  data: ModelInfo[];
}

// API key types
export interface ApiKey {
  id: string;
  name: string;
  key?: string; // Only included on creation
  permissions: Record<string, any>;
  quota_limit?: number;
  current_quota_usage: number;
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions?: Record<string, any>;
  quota_limit?: number;
  expires_at?: string;
}

export interface ApiKeyResponse {
  key: string;
  id: string;
}