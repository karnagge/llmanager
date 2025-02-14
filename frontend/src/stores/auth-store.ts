import { create } from "zustand";
import { AuthService, type User, type LoginCredentials, type RegisterData } from "@/services/auth/auth-service";

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
      if (!token) {
        set({ isLoading: false });
        return;
      }

      const user = await AuthService.getProfile();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      localStorage.removeItem("token");
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const { user, token } = await AuthService.login({ email, password });
      localStorage.setItem("token", token);
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
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  register: async (email: string, password: string, name: string) => {
    try {
      set({ isLoading: true });
      await AuthService.register({ email, password, name });
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));