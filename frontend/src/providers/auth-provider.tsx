"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/services/auth/auth-service";
import { Loader2 } from "lucide-react";

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

  // Initialize auth state when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initialize(initialState);
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

  // Handle loading state with useEffect to avoid hydration mismatch
  const [showLoading, setShowLoading] = useState(false);
  
  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
    } else {
      setShowLoading(false);
    }
  }, [isLoading]);

  if (showLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          <p className="text-sm text-zinc-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}