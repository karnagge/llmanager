"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/metrics/metric-card";
import { LineChart } from "@/components/charts/line-chart";
import {
  Users,
  MessagesSquare,
  Database,
  AlertCircle,
} from "lucide-react";
import {
  useDashboardMetrics,
  useRequestMetrics,
  useFormattedMetrics,
} from "@/hooks/api/use-metrics";
import { formatNumber } from "@/lib/utils/format";

interface DataPoint {
  date: string;
  [key: string]: string | number;
}

export default function DashboardPage() {
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardMetrics();
  const { data: requestData, isLoading: isRequestsLoading } = useRequestMetrics({
    interval: "day",
  });

  const { formattedData, categories } = useFormattedMetrics(requestData);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Usuários"
          value={formatNumber(dashboardData?.totalUsers ?? 0)}
          icon={<Users className="h-4 w-4" />}
          description="Últimos 30 dias"
          trend={
            dashboardData?.trends.users
              ? {
                  value: dashboardData.trends.users,
                  isPositive: dashboardData.trends.users > 0,
                }
              : undefined
          }
          isLoading={isDashboardLoading}
        />

        <MetricCard
          title="Requisições"
          value={formatNumber(dashboardData?.totalRequests ?? 0)}
          icon={<MessagesSquare className="h-4 w-4" />}
          description="Últimas 24h"
          trend={
            dashboardData?.trends.requests
              ? {
                  value: dashboardData.trends.requests,
                  isPositive: dashboardData.trends.requests > 0,
                }
              : undefined
          }
          isLoading={isDashboardLoading}
        />

        <MetricCard
          title="Tokens Consumidos"
          value={formatNumber(dashboardData?.totalTokens ?? 0)}
          icon={<Database className="h-4 w-4" />}
          description="Últimas 24h"
          trend={
            dashboardData?.trends.tokens
              ? {
                  value: dashboardData.trends.tokens,
                  isPositive: dashboardData.trends.tokens > 0,
                }
              : undefined
          }
          isLoading={isDashboardLoading}
        />

        <MetricCard
          title="Taxa de Erro"
          value={`${(dashboardData?.errorRate ?? 0).toFixed(2)}%`}
          icon={<AlertCircle className="h-4 w-4" />}
          description="Últimas 24h"
          trend={
            dashboardData?.trends.errors
              ? {
                  value: dashboardData.trends.errors,
                  isPositive: dashboardData.trends.errors < 0,
                }
              : undefined
          }
          isLoading={isDashboardLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LineChart
          title="Requisições por Dia"
          description="Volume de requisições nos últimos 7 dias"
          data={formattedData as DataPoint[]}
          categories={categories}
          index="date"
          valueFormatter={(value) => formatNumber(value)}
          isLoading={isRequestsLoading}
        />

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            {/* TODO: Implementar lista de atividades recentes */}
            <p className="text-sm text-zinc-500">
              Em breve: lista de atividades recentes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}