import { api } from "@/lib/api";
import { ApiResponse } from "@/lib/types";

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface DistributionPoint {
  name: string;
  value: number;
}

export interface ModelMetrics {
  totalTokens: number;
  totalRequests: number;
  averageLatency: number;
  errorRate: number;
  trends: {
    tokens: number;
    requests: number;
    latency: number;
    errors: number;
  };
  requestsByModel: DistributionPoint[];
  tokensByModel: DistributionPoint[];
  errorsByType: DistributionPoint[];
  timeSeriesData: {
    requests: TimeSeriesPoint[];
    tokens: TimeSeriesPoint[];
    latency: TimeSeriesPoint[];
    errors: TimeSeriesPoint[];
  };
}

export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  interval?: "hour" | "day" | "week" | "month";
  modelId?: string;
}

export class AnalyticsService {
  private static readonly BASE_PATH = "/analytics";

  static async getModelMetrics(
    params?: AnalyticsParams
  ): Promise<ApiResponse<ModelMetrics>> {
    return api.get<ModelMetrics>(
      `${this.BASE_PATH}/models`,
      params ? { ...params } : undefined
    );
  }

  static async getRequestsTimeSeries(
    params?: AnalyticsParams
  ): Promise<ApiResponse<TimeSeriesPoint[]>> {
    return api.get<TimeSeriesPoint[]>(
      `${this.BASE_PATH}/time-series/requests`,
      params ? { ...params } : undefined
    );
  }

  static async getTokensTimeSeries(
    params?: AnalyticsParams
  ): Promise<ApiResponse<TimeSeriesPoint[]>> {
    return api.get<TimeSeriesPoint[]>(
      `${this.BASE_PATH}/time-series/tokens`,
      params ? { ...params } : undefined
    );
  }

  static async getLatencyTimeSeries(
    params?: AnalyticsParams
  ): Promise<ApiResponse<TimeSeriesPoint[]>> {
    return api.get<TimeSeriesPoint[]>(
      `${this.BASE_PATH}/time-series/latency`,
      params ? { ...params } : undefined
    );
  }

  static async getErrorsTimeSeries(
    params?: AnalyticsParams
  ): Promise<ApiResponse<TimeSeriesPoint[]>> {
    return api.get<TimeSeriesPoint[]>(
      `${this.BASE_PATH}/time-series/errors`,
      params ? { ...params } : undefined
    );
  }

  static async getModelDistribution(
    metric: "requests" | "tokens"
  ): Promise<ApiResponse<DistributionPoint[]>> {
    return api.get<DistributionPoint[]>(
      `${this.BASE_PATH}/distribution/models/${metric}`
    );
  }

  static async getErrorDistribution(): Promise<ApiResponse<DistributionPoint[]>> {
    return api.get<DistributionPoint[]>(`${this.BASE_PATH}/distribution/errors`);
  }
}