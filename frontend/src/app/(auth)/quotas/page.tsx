"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, MoreVertical, AlertTriangle, Bell } from "lucide-react";
import { QuotaUsageRing } from "@/components/quotas/quota-usage-ring";
import { QuotaLimitDialog } from "@/components/quotas/quota-limit-dialog";
import { QuotaAlert } from "@/components/quotas/quota-alert";
import { QuotaAlertDialog } from "@/components/quotas/quota-alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "@/components/charts/line-chart";
import {
  useQuotaLimits,
  useQuotaUsage,
  useFormattedQuotaUsage,
  useQuotaAlerts,
  useDeleteQuotaAlert,
} from "@/hooks/api/use-quotas";
import { QuotaLimit } from "@/services/quotas/quota-service";
import { DataTable } from "@/components/ui/data-table";
import { formatNumber } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuotasPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<QuotaLimit["period"]>("MONTHLY");
  const { data: limits, isLoading: isLoadingLimits } = useQuotaLimits();
  const { data: alerts } = useQuotaAlerts();
  const deleteAlert = useDeleteQuotaAlert();

  const { data: tokenUsage } = useQuotaUsage("TOKENS", selectedPeriod);
  const { data: requestUsage } = useQuotaUsage("REQUESTS", selectedPeriod);

  const formattedTokenUsage = useFormattedQuotaUsage(tokenUsage);
  const formattedRequestUsage = useFormattedQuotaUsage(requestUsage);

  const handleDismissAlert = async (alertId: string) => {
    try {
      await deleteAlert.mutateAsync(alertId);
    } catch (error) {
      console.error("Erro ao dispensar alerta:", error);
    }
  };

  const columns: Array<{
    key: keyof QuotaLimit;
    header: string;
    render?: (value: string | number, item: QuotaLimit) => React.ReactNode;
  }> = [
    {
      key: "type",
      header: "Tipo",
      render: (value: string | number) => (
        <span>{value === "TOKENS" ? "Tokens" : "Requisições"}</span>
      ),
    },
    {
      key: "limit",
      header: "Limite",
      render: (value: string | number) => formatNumber(Number(value)),
    },
    {
      key: "period",
      header: "Período",
      render: (value: string | number) => {
        const periods: Record<string, string> = {
          DAILY: "Diário",
          MONTHLY: "Mensal",
          YEARLY: "Anual",
        };
        return periods[value.toString()] || value;
      },
    },
    {
      key: "used",
      header: "Usado",
      render: (value: string | number, quota: QuotaLimit) => (
        <div className="flex items-center gap-2">
          {formatNumber(Number(value))}
          {(Number(value) / quota.limit) * 100 >= 90 && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </div>
      ),
    },
    {
      key: "id",
      header: "",
      render: (_value: string | number, quota: QuotaLimit) => (
        <QuotaLimitDialog
          trigger={
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          }
          quota={quota}
        />
      ),
    },
  ];

  if (isLoadingLimits) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Gerenciamento de Quotas</h1>
        <div className="flex gap-2">
          <QuotaAlertDialog
            trigger={
              <Button variant="outline">
                <Bell className="mr-2 h-4 w-4" />
                Novo Alerta
              </Button>
            }
          />
          <QuotaLimitDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Quota
              </Button>
            }
          />
        </div>
      </div>

      {alerts && alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {alerts.map((alert) => (
              <QuotaAlert
                key={alert.id}
                alert={alert}
                onDismiss={handleDismissAlert}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <QuotaUsageRing
          title="Uso de Tokens"
          used={formattedTokenUsage.used}
          total={formattedTokenUsage.total}
          unit="tokens"
        />
        <QuotaUsageRing
          title="Uso de Requisições"
          used={formattedRequestUsage.used}
          total={formattedRequestUsage.total}
          unit="req"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <LineChart
          title="Consumo de Tokens"
          description="Consumo ao longo do tempo"
          data={formattedTokenUsage.data}
          categories={["value"]}
          index="date"
          valueFormatter={(value) => formatNumber(value)}
        />
        <LineChart
          title="Volume de Requisições"
          description="Requisições ao longo do tempo"
          data={formattedRequestUsage.data}
          categories={["value"]}
          index="date"
          valueFormatter={(value) => formatNumber(value)}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Limites Configurados</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === "DAILY" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("DAILY")}
              >
                Diário
              </Button>
              <Button
                variant={selectedPeriod === "MONTHLY" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("MONTHLY")}
              >
                Mensal
              </Button>
              <Button
                variant={selectedPeriod === "YEARLY" ? "default" : "outline"}
                onClick={() => setSelectedPeriod("YEARLY")}
              >
                Anual
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable<QuotaLimit>
            data={limits ?? []}
            columns={columns}
          />
        </CardContent>
      </Card>
    </div>
  );
}