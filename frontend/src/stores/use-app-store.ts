import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/lib/types';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  theme: 'light' | 'dark' | 'system';
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      theme: 'system',
      setUser: (user: User | null) =>
        set({
          user,
          isAuthenticated: !!user,
        }),
      setToken: (token: string | null) =>
        set({
          token,
          isAuthenticated: !!token,
        }),
      setTheme: (theme: 'light' | 'dark' | 'system') =>
        set({
          theme,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'app-storage',
      partialize: (state: AppState) => ({
        token: state.token,
        theme: state.theme,
      }),
    }
  )
);