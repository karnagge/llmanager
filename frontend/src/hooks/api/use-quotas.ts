import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QuotaService, type QuotaLimit, type QuotaUsage, type CreateQuotaLimitDTO, type CreateQuotaAlertDTO } from "@/services/quotas/quota-service";

// Hooks para Limites de Quota
export function useQuotaLimits() {
  return useQuery({
    queryKey: ["quotas", "limits"],
    queryFn: () => QuotaService.getLimits(),
    select: (response) => response.data,
  });
}

export function useCreateQuotaLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuotaLimitDTO) => QuotaService.createLimit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotas", "limits"] });
    },
  });
}

export function useUpdateQuotaLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      limitId,
      data,
    }: {
      limitId: string;
      data: Partial<CreateQuotaLimitDTO>;
    }) => QuotaService.updateLimit(limitId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotas", "limits"] });
    },
  });
}

export function useDeleteQuotaLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (limitId: string) => QuotaService.deleteLimit(limitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotas", "limits"] });
    },
  });
}

// Hooks para Alertas de Quota
export function useQuotaAlerts() {
  return useQuery({
    queryKey: ["quotas", "alerts"],
    queryFn: () => QuotaService.getAlerts(),
    select: (response) => response.data,
  });
}

export function useCreateQuotaAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuotaAlertDTO) => QuotaService.createAlert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotas", "alerts"] });
    },
  });
}

export function useDeleteQuotaAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => QuotaService.deleteAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotas", "alerts"] });
    },
  });
}

// Hook para Uso de Quota
export function useQuotaUsage(type: QuotaLimit["type"], period: QuotaLimit["period"]) {
  return useQuery({
    queryKey: ["quotas", "usage", type, period],
    queryFn: () => QuotaService.getUsage(type, period),
    select: (response) => response.data,
    refetchInterval: 60000, // Atualiza a cada minuto
  });
}

// Hook para formatar dados de uso para gráficos
export function useFormattedQuotaUsage(usage?: QuotaUsage) {
  if (!usage) return { data: [], total: 0, used: 0, percentage: 0 };

  const total = usage.total;
  const used = usage.used;
  const percentage = (used / total) * 100;

  const data = usage.usage.map((point) => ({
    date: point.date,
    value: point.value,
  }));

  return {
    data,
    total,
    used,
    percentage,
  };
}