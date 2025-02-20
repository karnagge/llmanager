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
  console.log("[AuthProvider] Mounting AuthProvider", { hasInitialState: !!initialState });
  
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

  // Ensure we only initialize on the client side
  const [isClient, setIsClient] = useState(false);

  // First, just mark that we're on the client
  useEffect(() => {
    console.log("[AuthProvider] Mounting effect");
    
    // Use setTimeout to ensure we're fully client-side
    const timer = setTimeout(() => {
      console.log("[AuthProvider] Setting client-side flag");
      setIsClient(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Then, only initialize auth when we know we're on client side
  useEffect(() => {
    if (!isClient) {
      console.log("[AuthProvider] Not yet client-side, skipping initialization");
      return;
    }

    console.log("[AuthProvider] Starting client-side initialization");
    
    try {
      initialize(initialState);
    } catch (error) {
      console.error("[AuthProvider] Initialization error:", error);
    }
  }, [isClient, initialize, initialState]);

  const login = async (email: string, password: string) => {
    console.log("[AuthProvider] Login attempt", { email });
    await storeLogin(email, password);
    console.log("[AuthProvider] Login successful, redirecting to dashboard");
    router.push("/dashboard");
  };

  const logout = async () => {
    console.log("[AuthProvider] Logout initiated");
    await storeLogout();
    console.log("[AuthProvider] Logout successful, redirecting to login");
    router.push("/login");
  };

  const register = async (email: string, password: string, name: string) => {
    console.log("[AuthProvider] Register attempt", { email, name });
    await storeRegister(email, password, name);
    console.log("[AuthProvider] Registration successful, redirecting to login");
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

  console.log("[AuthProvider] Current auth state:", {
    isAuthenticated,
    isLoading,
    hasUser: !!user
  });

  // Handle loading state with useEffect to avoid hydration mismatch
  const [showLoading, setShowLoading] = useState(false);
  
  useEffect(() => {
    console.log("[AuthProvider] Loading state change:", { isLoading, showLoading });
    if (isLoading) {
      console.log("[AuthProvider] Showing loading state");
      setShowLoading(true);
    } else {
      console.log("[AuthProvider] Hiding loading state");
      setShowLoading(false);
    }
  }, [isLoading]);

  // Don't render anything until we confirm we're on the client
  if (!isClient) {
    console.log("[AuthProvider] Skipping render during SSR");
    return null;
  }

  if (showLoading) {
    console.log("[AuthProvider] Rendering loading state");
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          <p className="text-sm text-zinc-500">Carregando...</p>
        </div>
      </div>
    );
  }

  console.log("[AuthProvider] Rendering with auth context");
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}