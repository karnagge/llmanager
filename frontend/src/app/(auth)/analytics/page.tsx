"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/metrics/metric-card";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { formatNumber } from "@/lib/utils/format";
import {
  Activity,
  BarChart3,
  Clock,
  AlertTriangle,
  Zap,
  MessageSquare,
} from "lucide-react";
import {
  useModelMetrics,
  useRequestsTimeSeries,
  useTokensTimeSeries,
  useModelDistribution,
  useErrorDistribution,
} from "@/hooks/api/use-analytics";
import type { AnalyticsParams } from "@/services/metrics/analytics-service";
import { endOfDay, startOfDay, subDays } from "date-fns";

type Period = "24h" | "7d" | "30d";

const getTimeParams = (period: Period): AnalyticsParams => {
  switch (period) {
    case "24h":
      return {
        startDate: startOfDay(subDays(new Date(), 1)).toISOString(),
        endDate: endOfDay(new Date()).toISOString(),
        interval: "hour",
      };
    case "7d":
      return {
        startDate: startOfDay(subDays(new Date(), 7)).toISOString(),
        endDate: endOfDay(new Date()).toISOString(),
        interval: "day",
      };
    case "30d":
      return {
        startDate: startOfDay(subDays(new Date(), 30)).toISOString(),
        endDate: endOfDay(new Date()).toISOString(),
        interval: "day",
      };
  }
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("24h");
  const params = getTimeParams(period);

  const { data: metrics, isLoading: isLoadingMetrics } = useModelMetrics(params);
  const { data: requests } = useRequestsTimeSeries(params);
  const { data: tokens } = useTokensTimeSeries(params);
  const { data: modelRequests } = useModelDistribution("requests");
  const { data: modelTokens } = useModelDistribution("tokens");
  const { data: errors } = useErrorDistribution();

  // Formatação dos dados para os gráficos
  const requestData = requests?.map((point) => ({
    date: point.date,
    value: point.value,
  })) ?? [];

  const tokenData = tokens?.map((point) => ({
    date: point.date,
    value: point.value,
  })) ?? [];

  const modelRequestData = modelRequests?.map((point) => ({
    name: point.name,
    value: point.value,
  })) ?? [];

  const modelTokenData = modelTokens?.map((point) => ({
    name: point.name,
    value: point.value,
  })) ?? [];

  const errorData = errors?.map((point) => ({
    name: point.name,
    value: point.value,
  })) ?? [];

  if (isLoadingMetrics) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Métricas e Analytics</h1>
        <div className="flex gap-2">
          <Button
            variant={period === "24h" ? "default" : "outline"}
            onClick={() => setPeriod("24h")}
          >
            24 horas
          </Button>
          <Button
            variant={period === "7d" ? "default" : "outline"}
            onClick={() => setPeriod("7d")}
          >
            7 dias
          </Button>
          <Button
            variant={period === "30d" ? "default" : "outline"}
            onClick={() => setPeriod("30d")}
          >
            30 dias
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Requisições"
          value={formatNumber(metrics?.totalRequests ?? 0)}
          icon={<MessageSquare className="h-4 w-4" />}
          trend={
            metrics?.trends.requests
              ? {
                  value: metrics.trends.requests,
                  isPositive: metrics.trends.requests > 0,
                }
              : undefined
          }
        />
        <MetricCard
          title="Tokens Consumidos"
          value={formatNumber(metrics?.totalTokens ?? 0)}
          icon={<Zap className="h-4 w-4" />}
          trend={
            metrics?.trends.tokens
              ? {
                  value: metrics.trends.tokens,
                  isPositive: metrics.trends.tokens > 0,
                }
              : undefined
          }
        />
        <MetricCard
          title="Latência Média"
          value={`${(metrics?.averageLatency ?? 0).toFixed(2)}ms`}
          icon={<Clock className="h-4 w-4" />}
          trend={
            metrics?.trends.latency
              ? {
                  value: metrics.trends.latency,
                  isPositive: metrics.trends.latency < 0,
                }
              : undefined
          }
        />
        <MetricCard
          title="Taxa de Erro"
          value={`${(metrics?.errorRate ?? 0).toFixed(2)}%`}
          icon={<AlertTriangle className="h-4 w-4" />}
          trend={
            metrics?.trends.errors
              ? {
                  value: metrics.trends.errors,
                  isPositive: metrics.trends.errors < 0,
                }
              : undefined
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AreaChart
          title="Requisições por Período"
          description="Volume de requisições ao longo do tempo"
          data={requestData}
          categories={["value"]}
          index="date"
          valueFormatter={formatNumber}
        />
        <AreaChart
          title="Consumo de Tokens"
          description="Consumo de tokens ao longo do tempo"
          data={tokenData}
          categories={["value"]}
          index="date"
          valueFormatter={formatNumber}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribuição por Modelo
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <PieChart
              title="Requisições"
              data={modelRequestData}
              variant="pie"
            />
            <PieChart
              title="Tokens"
              data={modelTokenData}
              variant="pie"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Distribuição de Erros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              title="Erros por Tipo"
              data={errorData}
              categories={["value"]}
              index="name"
              layout="horizontal"
              valueFormatter={formatNumber}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}