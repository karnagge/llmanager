import { api } from "@/lib/api";
import { ApiResponse } from "@/lib/types";
import { toRecord } from "@/lib/utils/type-utils";

export interface MetricPoint {
  date: string;
  value: number;
}

export interface MetricData {
  [key: string]: MetricPoint[];
}

export interface DashboardMetrics {
  totalUsers: number;
  totalRequests: number;
  totalTokens: number;
  errorRate: number;
  trends: {
    users: number;
    requests: number;
    tokens: number;
    errors: number;
  };
  graphs: {
    requests: MetricPoint[];
    tokens: MetricPoint[];
    errors: MetricPoint[];
  };
}

export interface MetricsParams {
  startDate?: string;
  endDate?: string;
  interval?: "hour" | "day" | "week" | "month";
}

export class MetricsService {
  private static readonly BASE_PATH = "/metrics";

  static async getDashboardMetrics(
    params?: MetricsParams
  ): Promise<ApiResponse<DashboardMetrics>> {
    return api.get<DashboardMetrics>(
      `${this.BASE_PATH}/dashboard`,
      params ? toRecord(params) : undefined
    );
  }

  static async getRequestMetrics(
    params?: MetricsParams
  ): Promise<ApiResponse<MetricData>> {
    return api.get<MetricData>(
      `${this.BASE_PATH}/requests`,
      params ? toRecord(params) : undefined
    );
  }

  static async getTokenMetrics(
    params?: MetricsParams
  ): Promise<ApiResponse<MetricData>> {
    return api.get<MetricData>(
      `${this.BASE_PATH}/tokens`,
      params ? toRecord(params) : undefined
    );
  }

  static async getErrorMetrics(
    params?: MetricsParams
  ): Promise<ApiResponse<MetricData>> {
    return api.get<MetricData>(
      `${this.BASE_PATH}/errors`,
      params ? toRecord(params) : undefined
    );
  }
}