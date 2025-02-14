"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { GrafanaDashboard, GrafanaPanel } from "@/components/metrics/grafana-embed";
import { MetricsExportDialog } from "@/components/metrics/metrics-export-dialog";
import { ScheduledReports } from "@/components/metrics/scheduled-reports";
import { GRAFANA_DASHBOARD_UID } from "@/hooks/metrics/use-grafana";

export default function MetricsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Métricas e Analytics</h1>
          <MetricsExportDialog />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <GrafanaDashboard
              title="Dashboard Geral"
              description="Visão geral das métricas do sistema"
              dashboardUid={GRAFANA_DASHBOARD_UID}
              timeRange={{ from: "now-24h", to: "now" }}
              height="600px"
            />
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* API Performance */}
              <GrafanaPanel
                title="Performance da API"
                description="Taxa de requisições e latência"
                dashboardUid={GRAFANA_DASHBOARD_UID}
                panelId={1}
                height="300px"
              />

              {/* Error Rates */}
              <GrafanaPanel
                title="Taxa de Erro"
                description="Monitoramento de erros do sistema"
                dashboardUid={GRAFANA_DASHBOARD_UID}
                panelId={4}
                height="300px"
              />

              {/* Token Usage */}
              <GrafanaPanel
                title="Uso de Tokens"
                description="Consumo de tokens por tenant"
                dashboardUid={GRAFANA_DASHBOARD_UID}
                panelId={3}
                height="300px"
              />

              {/* Cache Performance */}
              <GrafanaPanel
                title="Performance do Cache"
                description="Taxa de acerto do cache"
                dashboardUid={GRAFANA_DASHBOARD_UID}
                panelId={5}
                height="300px"
              />

              {/* Database Connections */}
              <GrafanaPanel
                title="Conexões de Banco de Dados"
                description="Número de conexões ativas"
                dashboardUid={GRAFANA_DASHBOARD_UID}
                panelId={7}
                height="300px"
              />

              {/* Memory Usage */}
              <GrafanaPanel
                title="Uso de Memória"
                description="Consumo de memória do Redis"
                dashboardUid={GRAFANA_DASHBOARD_UID}
                panelId={8}
                height="300px"
              />
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <ScheduledReports />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}