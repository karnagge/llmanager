import { useQuery } from "@tanstack/react-query";
import { MetricsParams, MetricsService } from "@/services/metrics/metrics-service";

export function useDashboardMetrics(params?: MetricsParams) {
  return useQuery({
    queryKey: ["metrics", "dashboard", params],
    queryFn: () => MetricsService.getDashboardMetrics(params),
    select: (response) => response.data,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
}

export function useRequestMetrics(params?: MetricsParams) {
  return useQuery({
    queryKey: ["metrics", "requests", params],
    queryFn: () => MetricsService.getRequestMetrics(params),
    select: (response) => response.data,
    refetchInterval: 30000,
  });
}

export function useTokenMetrics(params?: MetricsParams) {
  return useQuery({
    queryKey: ["metrics", "tokens", params],
    queryFn: () => MetricsService.getTokenMetrics(params),
    select: (response) => response.data,
    refetchInterval: 30000,
  });
}

export function useErrorMetrics(params?: MetricsParams) {
  return useQuery({
    queryKey: ["metrics", "errors", params],
    queryFn: () => MetricsService.getErrorMetrics(params),
    select: (response) => response.data,
    refetchInterval: 30000,
  });
}

// Hook para formatar dados para o gráfico
export function useFormattedMetrics(data?: { [key: string]: { date: string; value: number }[] }) {
  if (!data) return { formattedData: [], categories: [] };

  const categories = Object.keys(data);
  const allDates = new Set<string>();
  
  // Coleta todas as datas únicas
  Object.values(data).forEach((points) => {
    points.forEach((point) => allDates.add(point.date));
  });

  // Ordena as datas
  const sortedDates = Array.from(allDates).sort();

  // Cria os pontos de dados formatados
  const formattedData = sortedDates.map((date) => {
    const point: { [key: string]: string | number } = { date };
    categories.forEach((category) => {
      const value = data[category].find((p) => p.date === date)?.value ?? 0;
      point[category] = value;
    });
    return point;
  });

  return {
    formattedData,
    categories,
  };
}