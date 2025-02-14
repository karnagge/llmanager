"use client";

import { Inter } from "next/font/google";
import { type Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryClientProvider } from "@/providers/query-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LLM Manager",
  description: "Gerenciamento de LLMs e uso de tokens",
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: "/favicon.ico",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryClientProvider>
          <AuthProvider>
            <ThemeProvider>
              {children}
              <Toaster
                richColors
                closeButton
                position="top-right"
                duration={4000}
                expand={false}
                theme="system"
              />
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
