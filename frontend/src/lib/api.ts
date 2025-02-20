import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse } from './types';

class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;

  private constructor() {
    console.log("[ApiClient] Initializing ApiClient");
    
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // In client-side context only
    if (typeof window !== 'undefined') {
      console.log("[ApiClient] Client-side context detected, setting up");
      this.setupInterceptors();
      this.initializeFromStorage();
    } else {
      console.log("[ApiClient] Server-side context detected, skipping setup");
    }
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private initializeFromStorage() {
    try {
      console.log("[ApiClient] Initializing from storage");
      
      if (typeof window === 'undefined') {
        console.log("[ApiClient] Server-side context, skipping storage initialization");
        return;
      }

      // Wrap storage access in try-catch
      console.log("[ApiClient] Checking stored credentials");
      let token, apiKey;
      
      try {
        token = window.localStorage.getItem('token');
        apiKey = window.localStorage.getItem('apiKey');
      } catch (error) {
        console.log("[ApiClient] Storage access error:", error);
        return;
      }

      console.log("[ApiClient] Storage check:", {
        hasToken: !!token,
        hasApiKey: !!apiKey,
        tokenStart: token ? token.substring(0, 10) + '...' : null
      });

      if (token) {
        console.log("[ApiClient] Setting stored auth token");
        this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      if (apiKey) {
        console.log("[ApiClient] Setting stored API key");
        this.client.defaults.headers.common['X-API-Key'] = apiKey;
      }
    } catch (error) {
      console.error("[ApiClient] Error in initializeFromStorage:", error);
    }
  }

  private setupInterceptors() {
    console.log("[ApiClient] Setting up interceptors");
    
    // Skip interceptor setup in SSR
    if (typeof window === 'undefined') {
      console.log("[ApiClient] Server-side context, skipping interceptors setup");
      return;
    }

    this.client.interceptors.request.use(
      (config) => {
        console.log("[ApiClient] Processing request interceptor");
        
        // Add API key header
        const apiKey = window.localStorage.getItem('apiKey');
        if (apiKey) {
          console.log("[ApiClient] Adding API key header");
          config.headers['X-API-Key'] = apiKey;
        }

        // Add Authorization header
        const token = window.localStorage.getItem('token');
        if (token) {
          console.log("[ApiClient] Adding Authorization header");
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error("[ApiClient] Request interceptor error:", error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          console.log("[ApiClient] 401 response, clearing auth and redirecting");
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
  // Helper method to set API key
  public setApiKey(apiKey: string) {
    console.log("[ApiClient] Setting API key");
    
    // Skip in SSR context
    if (typeof window === 'undefined') {
      console.log("[ApiClient] Server-side context, skipping setApiKey");
      return;
    }

    window.localStorage.setItem('apiKey', apiKey);
    this.client.defaults.headers.common['X-API-Key'] = apiKey;
    console.log("[ApiClient] API key set successfully");
  }

  // Helper method to set auth token
  public setToken(token: string) {
    console.log("[ApiClient] Setting auth token");
    
    // Skip in SSR context
    if (typeof window === 'undefined') {
      console.log("[ApiClient] Server-side context, skipping setToken");
      return;
    }

    window.localStorage.setItem('token', token);
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log("[ApiClient] Auth token set successfully");
  }

  // Helper method to clear auth data
  public clearAuth() {
    console.log("[ApiClient] Clearing auth data");
    
    // Skip in SSR context
    if (typeof window === 'undefined') {
      console.log("[ApiClient] Server-side context, skipping clearAuth");
      return;
    }

    window.localStorage.removeItem('token');
    window.localStorage.removeItem('apiKey');
    delete this.client.defaults.headers.common['Authorization'];
    delete this.client.defaults.headers.common['X-API-Key'];
    console.log("[ApiClient] Auth data cleared successfully");
  }
}

export const api = ApiClient.getInstance();