"use client";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            LLM Manager
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Faça login para acessar o painel
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />

            <div className="mt-4 text-center text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Não tem uma conta?{" "}
              </span>
              <Link
                href="/register"
                className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
              >
                Registre-se
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-zinc-600 dark:text-zinc-400">
          Ao fazer login, você concorda com nossos{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            termos de serviço
          </Link>{" "}
          e{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            política de privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  );
}