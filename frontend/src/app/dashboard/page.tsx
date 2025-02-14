"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import {
  ChartBar,
  Database,
  Users,
  AlertCircle,
} from "lucide-react";

const chartData = [
  {
    date: "Jan 22",
    "API Calls": 2890,
    "Error Rate": 23,
  },
  {
    date: "Feb 22",
    "API Calls": 3890,
    "Error Rate": 19,
  },
  {
    date: "Mar 22",
    "API Calls": 4200,
    "Error Rate": 21,
  },
  {
    date: "Apr 22",
    "API Calls": 4500,
    "Error Rate": 17,
  },
  {
    date: "May 22",
    "API Calls": 5100,
    "Error Rate": 12,
  },
];

const modelUsageData = [
  {
    date: "Segunda",
    GPT4: 234,
    GPT35: 456,
    Claude: 321,
  },
  {
    date: "Terça",
    GPT4: 245,
    GPT35: 438,
    Claude: 367,
  },
  {
    date: "Quarta",
    GPT4: 289,
    GPT35: 479,
    Claude: 390,
  },
  {
    date: "Quinta",
    GPT4: 276,
    GPT35: 523,
    Claude: 405,
  },
  {
    date: "Sexta",
    GPT4: 302,
    GPT35: 545,
    Claude: 432,
  },
];

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Usuários"
            value="1,234"
            icon={<Users className="h-4 w-4" />}
            description="Último mês"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Tokens Consumidos"
            value="2.4M"
            icon={<Database className="h-4 w-4" />}
            description="Últimos 7 dias"
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Requisições/min"
            value="324"
            icon={<ChartBar className="h-4 w-4" />}
            description="Média atual"
          />
          <StatCard
            title="Taxa de Erro"
            value="0.12%"
            icon={<AlertCircle className="h-4 w-4" />}
            description="Últimas 24h"
            trend={{ value: 2, isPositive: false }}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <LineChart
            title="Performance da API"
            description="Chamadas da API e Taxa de Erro nos últimos 5 meses"
            data={chartData}
            index="date"
            categories={["API Calls", "Error Rate"]}
            colors={["emerald", "rose"]}
            valueFormatter={(value) => `${value.toLocaleString()}`}
          />
          <BarChart
            title="Uso por Modelo"
            description="Requisições por modelo LLM na última semana"
            data={modelUsageData}
            index="date"
            categories={["GPT4", "GPT35", "Claude"]}
            colors={["indigo", "sky", "violet"]}
            valueFormatter={(value) => `${value.toLocaleString()}`}
          />
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder para atividades recentes */}
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100">
                  <Users className="h-4 w-4 text-zinc-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Novo usuário adicionado</p>
                  <p className="text-xs text-zinc-500">Há 5 minutos</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100">
                  <Database className="h-4 w-4 text-zinc-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Quota atualizada</p>
                  <p className="text-xs text-zinc-500">Há 15 minutos</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100">
                  <AlertCircle className="h-4 w-4 text-zinc-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Alerta de quota</p>
                  <p className="text-xs text-zinc-500">Há 30 minutos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}