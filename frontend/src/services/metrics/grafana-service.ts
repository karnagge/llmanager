import {
  GrafanaDashboard,
  GrafanaDatasource,
  GrafanaHealthCheckResult,
  GrafanaMetricsResponse,
} from "@/lib/types/grafana";

interface GrafanaConfig {
  baseUrl: string;
  apiKey: string;
}

export class GrafanaService {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: GrafanaConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.apiKey = config.apiKey;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Grafana API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getDashboard(uid: string): Promise<GrafanaDashboard> {
    return this.fetch<GrafanaDashboard>(`/api/dashboards/uid/${uid}`);
  }

  async getDashboardToken(dashboardId: number, panelId?: number): Promise<{ token: string }> {
    const params = new URLSearchParams();
    if (panelId) params.append("panelId", panelId.toString());

    return this.fetch<{ token: string }>(
      `/api/dashboards/${dashboardId}/tokens?${params}`
    );
  }

  getEmbedUrl(dashboardUid: string, params: Record<string, string> = {}): string {
    const searchParams = new URLSearchParams({
      ...params,
      kiosk: "", // Enable kiosk mode
    });

    return `${this.baseUrl}/d/${dashboardUid}?${searchParams.toString()}`;
  }

  getPanelEmbedUrl(dashboardUid: string, panelId: number, params: Record<string, string> = {}): string {
    const searchParams = new URLSearchParams({
      ...params,
      viewPanel: panelId.toString(),
      kiosk: "", // Enable kiosk mode
    });

    return `${this.baseUrl}/d/${dashboardUid}?${searchParams.toString()}`;
  }

  /**
   * Get usage metrics for the specified time range
   * @param from ISO timestamp or relative time (e.g., "now-6h")
   * @param to ISO timestamp or relative time (e.g., "now")
   */
  async getMetrics(from: string, to: string): Promise<GrafanaMetricsResponse> {
    const params = new URLSearchParams({ from, to });
    return this.fetch<GrafanaMetricsResponse>(`/api/metrics?${params}`);
  }

  /**
   * Get the list of available datasources
   */
  async getDatasources(): Promise<GrafanaDatasource[]> {
    return this.fetch<GrafanaDatasource[]>("/api/datasources");
  }

  /**
   * Test datasource connection
   * @param datasourceId The ID of the datasource to test
   */
  async testDatasource(datasourceId: number): Promise<GrafanaHealthCheckResult> {
    return this.fetch<GrafanaHealthCheckResult>(`/api/datasources/${datasourceId}/health`);
  }
}