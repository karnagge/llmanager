export interface ExportOptions {
  format: "csv" | "json";
  from: string;
  to: string;
  metrics: string[];
  filters?: Record<string, string>;
}

export interface ScheduledReportConfig {
  name: string;
  description?: string;
  schedule: {
    frequency: "daily" | "weekly" | "monthly";
    time: string; // HH:mm format
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
  };
  format: "csv" | "json";
  metrics: string[];
  filters?: Record<string, string>;
  recipients: string[];
}

export class MetricsExportService {
  private apiBaseUrl: string;

  constructor(baseUrl: string) {
    this.apiBaseUrl = baseUrl;
  }

  /**
   * Export metrics data in CSV or JSON format
   */
  async exportData(options: ExportOptions): Promise<Blob> {
    const params = new URLSearchParams({
      format: options.format,
      from: options.from,
      to: options.to,
      metrics: options.metrics.join(","),
      ...(options.filters && { filters: JSON.stringify(options.filters) }),
    });

    const response = await fetch(
      `${this.apiBaseUrl}/api/metrics/export?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: options.format === "csv" ? "text/csv" : "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Create a new scheduled report
   */
  async createScheduledReport(config: ScheduledReportConfig): Promise<{ id: string }> {
    const response = await fetch(`${this.apiBaseUrl}/api/metrics/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`Failed to create report: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all scheduled reports
   */
  async getScheduledReports(): Promise<Array<{ id: string } & ScheduledReportConfig>> {
    const response = await fetch(`${this.apiBaseUrl}/api/metrics/reports`);

    if (!response.ok) {
      throw new Error(`Failed to fetch reports: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update a scheduled report
   */
  async updateScheduledReport(id: string, config: ScheduledReportConfig): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/api/metrics/reports/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`Failed to update report: ${response.statusText}`);
    }
  }

  /**
   * Delete a scheduled report
   */
  async deleteScheduledReport(id: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/api/metrics/reports/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete report: ${response.statusText}`);
    }
  }

  /**
   * Helper function to trigger a download of the exported data
   */
  static downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}