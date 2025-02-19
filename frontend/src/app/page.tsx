'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth/use-auth';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Only redirect to dashboard if authenticated
    // Otherwise, let the middleware handle the redirect to login
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Return null since we're either redirecting to dashboard or letting middleware handle login redirect
  return null;
}
