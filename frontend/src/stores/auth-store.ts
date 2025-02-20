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

export const useAuthStore = create<AuthState>((set) => {
  // Helper function to safely update state
  const safeSet = (newState: Partial<AuthState>) => {
    if (typeof window === 'undefined') {
      console.log("[AuthStore] Preventing SSR state update");
      return;
    }
    set(newState);
  };

  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,

    initialize: async (initialState) => {
      console.log("[AuthStore] Initialize called", { hasInitialState: !!initialState });

      if (initialState) {
        console.log("[AuthStore] Using initial state");
        safeSet({
          user: initialState.user ?? null,
          isAuthenticated: initialState.isAuthenticated ?? false,
          isLoading: false,
        });
        return;
      }

      if (typeof window === 'undefined') {
        console.log("[AuthStore] Server-side context detected");
        return;
      }

      try {
        safeSet({ isLoading: true });

        let token, apiKey;
        try {
          token = window.localStorage.getItem('token');
          apiKey = window.localStorage.getItem('apiKey');
        } catch (error) {
          console.error("[AuthStore] Storage access error:", error);
          safeSet({ isLoading: false });
          return;
        }

        if (!token || !apiKey) {
          console.log("[AuthStore] No credentials found");
          safeSet({ isLoading: false });
          return;
        }

        api.setToken(token);
        api.setApiKey(apiKey);

        const response = await AuthService.getProfile();
        if (response) {
          safeSet({ user: response, isAuthenticated: true, isLoading: false });
        } else {
          throw new Error('Failed to get user profile');
        }
      } catch (error) {
        console.error("[AuthStore] Failed to initialize auth:", error);
        api.clearAuth();
        safeSet({ user: null, isAuthenticated: false, isLoading: false });
      }
    },

    login: async (email, password) => {
      if (typeof window === 'undefined') return;

      try {
        safeSet({ isLoading: true });
        const { user, token, apiKey } = await AuthService.login({ email, password });
        if (token && apiKey) {
          api.setToken(token);
          api.setApiKey(apiKey);
          safeSet({ user, isAuthenticated: true });
        }
      } catch (error) {
        throw error;
      } finally {
        safeSet({ isLoading: false });
      }
    },

    logout: async () => {
      try {
        safeSet({ isLoading: true });
        await AuthService.logout();
      } catch (error) {
        console.error("[AuthStore] Failed to logout:", error);
      } finally {
        api.clearAuth();
        safeSet({ user: null, isAuthenticated: false, isLoading: false });
      }
    },

    register: async (email, password, name) => {
      if (typeof window === 'undefined') return;

      try {
        safeSet({ isLoading: true });
        const { token, apiKey } = await AuthService.register({ email, password, name });
        if (token && apiKey) {
          api.setToken(token);
          api.setApiKey(apiKey);
        }
      } catch (error) {
        throw error;
      } finally {
        safeSet({ isLoading: false });
      }
    },
  };
};

export const useAuthStore = create<AuthState>(createAuthStore);
    if (initialState) {
      console.log("[AuthStore] Using initial state");
      set({
        user: initialState.user ?? null,
        isAuthenticated: initialState.isAuthenticated ?? false,
        isLoading: false,
      });
      return;
    }

    if (typeof window === 'undefined') {
      console.log("[AuthStore] Server-side context detected, skipping initialization");
      set({ isLoading: false });
      return;
    }

    try {
      set({ isLoading: true });

      let token, apiKey;
      try {
        token = window.localStorage.getItem('token');
        apiKey = window.localStorage.getItem('apiKey');
      } catch (error) {
        console.error("[AuthStore] Storage access error:", error);
        set({ isLoading: false });
        return;
      }

      if (!token || !apiKey) {
        console.log("[AuthStore] No credentials found");
        set({ isLoading: false });
        return;
      }

      api.setToken(token);
      api.setApiKey(apiKey);

      const response = await AuthService.getProfile();
      if (response) {
        set({ user: response, isAuthenticated: true, isLoading: false });
      } else {
        throw new Error('Failed to get user profile');
      }
    } catch (error) {
      console.error("[AuthStore] Failed to initialize auth:", error);
      api.clearAuth();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    if (typeof window === 'undefined') return;

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
      console.error("[AuthStore] Failed to logout:", error);
    } finally {
      api.clearAuth();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  register: async (email: string, password: string, name: string) => {
    if (typeof window === 'undefined') return;
    
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
      
    console.log("[AuthStore] Initialize called", { hasInitialState: !!initialState });
    
    // Don't set loading during SSR
    if (typeof window !== 'undefined') {
      set({ isLoading: true });
    }

    if (initialState) {
      console.log("[AuthStore] Using initial state");
      set({
        user: initialState.user ?? null,
        isAuthenticated: initialState.isAuthenticated ?? false,
        isLoading: false,
      });
      return;
    }

    try {
      console.log("[AuthStore] Starting auth initialization");
      
      if (typeof window === 'undefined') {
        console.log("[AuthStore] Server-side context detected, skipping initialization");
        set({ isLoading: false });
        return;
      }

      console.log("[AuthStore] Client-side context, checking credentials");
      
      let token, apiKey;
      try {
        token = window.localStorage.getItem('token');
        apiKey = window.localStorage.getItem('apiKey');
      } catch (error) {
        console.error("[AuthStore] Storage access error:", error);
        set({ isLoading: false });
        return;
      }

      console.log("[AuthStore] Credentials check:", {
        hasToken: !!token,
        hasApiKey: !!apiKey,
        tokenPreview: token ? `${token.substring(0, 10)}...` : null
      });

      if (!token || !apiKey) {
        console.log("[AuthStore] No valid credentials found");
        set({ isLoading: false });
        return;
      }

      // Set auth headers before making request
      console.log("[AuthStore] Setting auth headers");
      api.setToken(token);
      api.setApiKey(apiKey);

      console.log("[AuthStore] Fetching user profile");
      const response = await AuthService.getProfile();
      
      if (response) {
        console.log("[AuthStore] Profile fetched successfully");
        set({ user: response, isAuthenticated: true, isLoading: false });
      } else {
        throw new Error('Failed to get user profile');
      }
    } catch (error) {
      console.error("[AuthStore] Failed to initialize auth:", error);
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