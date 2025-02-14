"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/auth/use-auth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthenticated, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          <p className="text-sm text-zinc-500">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, o useAuth já vai redirecionar para o login
  // Se estiver autenticado, renderiza o conteúdo
  return isAuthenticated ? <>{children}</> : null;
}