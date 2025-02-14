"use client";

import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            LLM Manager
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Crie sua conta para acessar o painel
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Criar conta</CardTitle>
          </CardHeader>
          <CardContent>
            <RegisterForm />

            <div className="mt-4 text-center text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Já tem uma conta?{" "}
              </span>
              <Link
                href="/login"
                className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
              >
                Faça login
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-zinc-600 dark:text-zinc-400">
          Ao criar uma conta, você concorda com nossos{" "}
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