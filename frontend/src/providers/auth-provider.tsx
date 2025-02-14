"use client";

import { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/services/auth/auth-service";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

export interface AuthProviderProps {
  children: React.ReactNode;
  initialState?: {
    user?: User | null;
    isAuthenticated?: boolean;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, initialState }: AuthProviderProps) {
  const router = useRouter();
  const {
    user,
    isLoading,
    isAuthenticated,
    initialize,
    login: storeLogin,
    logout: storeLogout,
    register: storeRegister,
  } = useAuthStore();

  useEffect(() => {
    if (initialState) {
      initialize(initialState);
    } else {
      initialize();
    }
  }, [initialize, initialState]);

  const login = async (email: string, password: string) => {
    await storeLogin(email, password);
    router.push("/dashboard");
  };

  const logout = async () => {
    await storeLogout();
    router.push("/login");
  };

  const register = async (email: string, password: string, name: string) => {
    await storeRegister(email, password, name);
    router.push("/login");
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}