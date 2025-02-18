import axios, { AxiosInstance } from 'axios';
import { ChatRequest, ChatResponse, ModelsResponse } from './types/llm';

/**
 * LLM API Client
 * Handles direct communication with the LLM API endpoints
 * Uses API key authentication instead of JWT tokens
 */
export class LLMApiClient {
  private client: AxiosInstance;
  private static instance: LLMApiClient;

  private constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 403) {
          // Handle quota exceeded or invalid API key
          console.error('API Key error:', error.response.data);
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): LLMApiClient {
    if (!LLMApiClient.instance) {
      LLMApiClient.instance = new LLMApiClient();
    }
    return LLMApiClient.instance;
  }

  public setApiKey(apiKey: string) {
    this.client.defaults.headers.common['X-API-Key'] = apiKey;
  }

  public clearApiKey() {
    delete this.client.defaults.headers.common['X-API-Key'];
  }

  async createChatCompletion(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await this.client.post<ChatResponse>('/v1/chat/completions', request);
      return response.data;
    } catch (error) {
      console.error('Error in chat completion:', error);
      throw error;
    }
  }

  async listModels(): Promise<ModelsResponse> {
    try {
      const response = await this.client.get<ModelsResponse>('/v1/models');
      return response.data;
    } catch (error) {
      console.error('Error listing models:', error);
      throw error;
    }
  }

  async getModel(modelId: string): Promise<ModelsResponse> {
    try {
      const response = await this.client.get<ModelsResponse>(`/v1/models/${modelId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting model:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const llmApi = LLMApiClient.getInstance();