"use client";

import { ReactNode, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { AuthService } from "@/services/auth/auth-service";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Verifica se há um token no localStorage
    const token = AuthService.getAuthToken();
    const refreshToken = AuthService.getRefreshToken();

    // Se houver token mas o estado não estiver autenticado
    if (token && refreshToken && !isAuthenticated) {
      const validateToken = async () => {
        try {
          // Tenta obter os dados do usuário
          const response = await AuthService.me();
          if (response.data) {
            // Se conseguir, atualiza o estado com os dados do usuário
            useAuthStore.setState({
              user: response.data,
              isAuthenticated: true,
            });
          } else {
            // Se não conseguir, limpa os tokens
            AuthService.clearTokens();
          }
        } catch {
          // Em caso de erro, limpa os tokens
          AuthService.clearTokens();
        }
      };

      validateToken();
    }
  }, [isAuthenticated]);

  return <>{children}</>;
}