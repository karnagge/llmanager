import { create } from "zustand";
import { AuthService, type User } from "@/services/auth/auth-service";
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
      if (typeof window === 'undefined') {
        set({ isLoading: false });
        return;
      }

      // Only try to get profile if we have both token and apiKey
      const token = window.localStorage.getItem('token');
      const apiKey = window.localStorage.getItem('apiKey');

      if (!token || !apiKey) {
        set({ isLoading: false });
        return;
      }

      // Set auth headers before making request
      api.setToken(token);
      api.setApiKey(apiKey);

      const response = await AuthService.getProfile();
      if (response) {
        set({ user: response, isAuthenticated: true, isLoading: false });
      } else {
        throw new Error('Failed to get user profile');
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      api.clearAuth();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      set({ isLoading: true });
      const { user, token, apiKey } = await AuthService.login({ email, password });
      if (token && apiKey) {
        api.setToken(token);
        api.setApiKey(apiKey);
        set({ user, isAuthenticated: true });
      }
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
      api.clearAuth();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  register: async (email: string, password: string, name: string) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      set({ isLoading: true });
      const { token, apiKey } = await AuthService.register({ email, password, name });
      if (token && apiKey) {
        api.setToken(token);
        api.setApiKey(apiKey);
      }
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));