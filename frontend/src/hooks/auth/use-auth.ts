import { useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { AuthService } from '@/services/auth/auth-service';

export const publicRoutes = ['/login', '/register'];

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, login, logout, register } = useAuthStore();

  const checkAuth = useCallback(async () => {
    try {
      if (!isAuthenticated && !publicRoutes.includes(pathname)) {
        // Se não estiver autenticado e não estiver em uma rota pública
        router.push('/login');
        return;
      }

      if (isAuthenticated && publicRoutes.includes(pathname)) {
        // Se estiver autenticado e tentar acessar uma rota pública
        router.push('/dashboard');
        return;
      }

      // Verifica se o token ainda é válido
      if (isAuthenticated) {
        try {
          await AuthService.me();
        } catch {
          // Se o token não for mais válido, faz logout
          await logout();
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    }
  }, [isAuthenticated, pathname, router, logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    checkAuth,
  };
}