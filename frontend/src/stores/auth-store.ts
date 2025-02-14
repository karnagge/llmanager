import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthService, AuthResponse } from '@/services/auth/auth-service';

interface AuthState {
  user: AuthResponse['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          const response = await AuthService.login({ email, password });
          
          if (response.data) {
            const { user, token, refreshToken } = response.data;
            AuthService.setAuthToken(token);
            AuthService.setRefreshToken(refreshToken);
            
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: 'Falha ao fazer login. Verifique suas credenciais.',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (name: string, email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          const response = await AuthService.register({ name, email, password });
          
          if (response.data) {
            const { user, token, refreshToken } = response.data;
            AuthService.setAuthToken(token);
            AuthService.setRefreshToken(refreshToken);
            
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: 'Falha ao criar conta. Tente novamente.',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await AuthService.logout();
          AuthService.clearTokens();
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: 'Erro ao fazer logout.',
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);