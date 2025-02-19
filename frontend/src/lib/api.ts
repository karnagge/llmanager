import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from './types';

class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;

  private constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // In client-side context only
    if (typeof window !== 'undefined') {
      this.setupInterceptors();
      this.initializeFromStorage();
    }
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private initializeFromStorage() {
    if (typeof window === 'undefined') return;

    const token = window.localStorage.getItem('token');
    const apiKey = window.localStorage.getItem('apiKey');

    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    if (apiKey) {
      this.client.defaults.headers.common['X-API-Key'] = apiKey;
    }
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window === 'undefined') return config;

        // Add API key header
        const apiKey = window.localStorage.getItem('apiKey');
        if (apiKey) {
          config.headers['X-API-Key'] = apiKey;
        }

        // Add Authorization header
        const token = window.localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          this.clearAuth();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.get(url, { params });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  async post<T, D = any>(url: string, data: D): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  async put<T, D = any>(url: string, data: D): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.put(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  async patch<T, D = any>(url: string, data: D): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.patch(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(url);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  private handleError(error: AxiosError) {
    if (error.response) {
      console.error('Erro de API:', error.response.data);
    } else if (error.request) {
      console.error('Erro de rede:', error.request);
    } else {
      console.error('Erro:', error.message);
    }
  }

  // Helper method to set API key
  public setApiKey(apiKey: string) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('apiKey', apiKey);
      this.client.defaults.headers.common['X-API-Key'] = apiKey;
    }
  }

  // Helper method to set auth token
  public setToken(token: string) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('token', token);
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  // Helper method to clear auth data
  public clearAuth() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('apiKey');
      delete this.client.defaults.headers.common['Authorization'];
      delete this.client.defaults.headers.common['X-API-Key'];
    }
  }
}

export const api = ApiClient.getInstance();