import { create } from "zustand";
import { AuthService, type User, type LoginCredentials, type RegisterData } from "@/services/auth/auth-service";
import { api } from "@/lib/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: (initialState?: { user?: User | null; isAuthenticated?: boolean }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async (initialState) => {
    if (initialState) {
      set({
        user: initialState.user ?? null,
        isAuthenticated: initialState.isAuthenticated ?? false,
        isLoading: false,
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const apiKey = localStorage.getItem("apiKey");
      
      if (!token || !apiKey) {
        set({ isLoading: false });
        return;
      }

      // Set the API key in the API client
      api.setApiKey(apiKey);

      const user = await AuthService.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("apiKey");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const { user, token, apiKey } = await AuthService.login({ email, password });
      localStorage.setItem("token", token);
      localStorage.setItem("apiKey", apiKey);
      api.setApiKey(apiKey);
      set({ user, isAuthenticated: true });
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await AuthService.logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("apiKey");
      api.clearAuth();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  register: async (email: string, password: string, name: string) => {
    try {
      set({ isLoading: true });
      const { token, apiKey } = await AuthService.register({ email, password, name });
      localStorage.setItem("token", token);
      localStorage.setItem("apiKey", apiKey);
      api.setApiKey(apiKey);
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));