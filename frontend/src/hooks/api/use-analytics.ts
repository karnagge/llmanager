import { useQuery } from "@tanstack/react-query";
import { AnalyticsService, type AnalyticsParams } from "@/services/metrics/analytics-service";
import { endOfDay, startOfDay, subDays } from "date-fns";

const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutos
const DEFAULT_CACHE_TIME = 10 * 60 * 1000; // 10 minutos

export function useModelMetrics(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics", "models", params],
    queryFn: () => AnalyticsService.getModelMetrics(params),
    select: (response) => response.data,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_CACHE_TIME,
  });
}

export function useRequestsTimeSeries(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics", "time-series", "requests", params],
    queryFn: () => AnalyticsService.getRequestsTimeSeries(params),
    select: (response) => response.data,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_CACHE_TIME,
  });
}

export function useTokensTimeSeries(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics", "time-series", "tokens", params],
    queryFn: () => AnalyticsService.getTokensTimeSeries(params),
    select: (response) => response.data,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_CACHE_TIME,
  });
}

export function useLatencyTimeSeries(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics", "time-series", "latency", params],
    queryFn: () => AnalyticsService.getLatencyTimeSeries(params),
    select: (response) => response.data,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_CACHE_TIME,
  });
}

export function useErrorsTimeSeries(params?: AnalyticsParams) {
  return useQuery({
    queryKey: ["analytics", "time-series", "errors", params],
    queryFn: () => AnalyticsService.getErrorsTimeSeries(params),
    select: (response) => response.data,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_CACHE_TIME,
  });
}

export function useModelDistribution(metric: "requests" | "tokens") {
  return useQuery({
    queryKey: ["analytics", "distribution", "models", metric],
    queryFn: () => AnalyticsService.getModelDistribution(metric),
    select: (response) => response.data,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_CACHE_TIME,
  });
}

export function useErrorDistribution() {
  return useQuery({
    queryKey: ["analytics", "distribution", "errors"],
    queryFn: () => AnalyticsService.getErrorDistribution(),
    select: (response) => response.data,
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_CACHE_TIME,
  });
}

// Helpers para períodos comuns
export function useLast24Hours() {
  return {
    startDate: startOfDay(subDays(new Date(), 1)).toISOString(),
    endDate: endOfDay(new Date()).toISOString(),
    interval: "hour" as const,
  };
}

export function useLast7Days() {
  return {
    startDate: startOfDay(subDays(new Date(), 7)).toISOString(),
    endDate: endOfDay(new Date()).toISOString(),
    interval: "day" as const,
  };
}

export function useLast30Days() {
  return {
    startDate: startOfDay(subDays(new Date(), 30)).toISOString(),
    endDate: endOfDay(new Date()).toISOString(),
    interval: "day" as const,
  };
}