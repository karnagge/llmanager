"use client";

import { QueryClient, QueryClientProvider as TanstackQueryProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

interface QueryClientProviderProps {
  children: ReactNode;
}

export function QueryClientProvider({ children }: QueryClientProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <TanstackQueryProvider client={queryClient}>
      {children}
    </TanstackQueryProvider>
  );
}