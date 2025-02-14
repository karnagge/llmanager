import { useQuery } from "@tanstack/react-query";
import { GrafanaService } from "@/services/metrics/grafana-service";
import {
  GrafanaDashboard,
  GrafanaDatasource,
  GrafanaHealthCheckResult,
  GrafanaMetricsResponse,
} from "@/lib/types/grafana";

const grafanaConfig = {
  baseUrl: process.env.NEXT_PUBLIC_GRAFANA_URL || "",
  apiKey: process.env.NEXT_PUBLIC_GRAFANA_API_KEY || "",
};

const grafanaService = new GrafanaService(grafanaConfig);

export const GRAFANA_DASHBOARD_UID = "llm_metrics"; // From our dashboard JSON

interface UseGrafanaOptions {
  enabled?: boolean;
}

export function useGrafanaDashboard(uid: string, options: UseGrafanaOptions = {}) {
  return useQuery<GrafanaDashboard>({
    queryKey: ["grafana", "dashboard", uid],
    queryFn: () => grafanaService.getDashboard(uid),
    enabled: options.enabled !== false && Boolean(grafanaConfig.apiKey),
  });
}

interface UseGrafanaMetricsOptions extends UseGrafanaOptions {
  from?: string;
  to?: string;
}

export function useGrafanaMetrics(options: UseGrafanaMetricsOptions = {}) {
  const { from = "now-6h", to = "now" } = options;

  return useQuery<GrafanaMetricsResponse>({
    queryKey: ["grafana", "metrics", from, to],
    queryFn: () => grafanaService.getMetrics(from, to),
    enabled: options.enabled !== false && Boolean(grafanaConfig.apiKey),
  });
}

interface UseGrafanaDatasourcesOptions extends UseGrafanaOptions {
  testConnection?: boolean;
}

export function useGrafanaDatasources(options: UseGrafanaDatasourcesOptions = {}) {
  const { testConnection = false } = options;

  const datasourcesQuery = useQuery<GrafanaDatasource[]>({
    queryKey: ["grafana", "datasources"],
    queryFn: () => grafanaService.getDatasources(),
    enabled: options.enabled !== false && Boolean(grafanaConfig.apiKey),
  });

  const healthQueries = useQuery<Array<{ id: number; health: GrafanaHealthCheckResult } | { id: number; error: Error }>>({
    queryKey: ["grafana", "datasources", "health"],
    queryFn: async () => {
      if (!datasourcesQuery.data) {
        throw new Error("No datasources available");
      }

      const healthChecks = await Promise.all(
        datasourcesQuery.data.map((ds) => 
          grafanaService
            .testDatasource(ds.id)
            .then(health => ({ id: ds.id, health }))
            .catch(error => ({ id: ds.id, error }))
        )
      );
      return healthChecks;
    },
    enabled: testConnection && datasourcesQuery.isSuccess && Boolean(grafanaConfig.apiKey),
  });

  return {
    datasources: datasourcesQuery,
    health: healthQueries,
  };
}

// Helper hook to get panel embed URLs
export function useGrafanaPanelUrl(dashboardUid: string, panelId: number, params: Record<string, string> = {}) {
  return grafanaService.getPanelEmbedUrl(dashboardUid, panelId, params);
}

// Helper hook to get dashboard embed URLs
export function useGrafanaDashboardUrl(dashboardUid: string, params: Record<string, string> = {}) {
  return grafanaService.getEmbedUrl(dashboardUid, params);
}

// Export the service for direct usage if needed
export { grafanaService };