import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SettingsService,
  type SystemPreferences,
  type ApiKey,
  type CreateApiKeyDto,
  type Webhook,
  type CreateWebhookDto,
  type NotificationSettings,
  type SystemLog,
} from "@/services/settings-service";

// Query keys
const settingsKeys = {
  all: ["settings"] as const,
  preferences: () => [...settingsKeys.all, "preferences"] as const,
  apiKeys: () => [...settingsKeys.all, "api-keys"] as const,
  webhooks: () => [...settingsKeys.all, "webhooks"] as const,
  notifications: () => [...settingsKeys.all, "notifications"] as const,
  logs: () => [...settingsKeys.all, "logs"] as const,
  log: (filters: Record<string, any>) => [...settingsKeys.logs(), { filters }] as const,
};

// System Preferences Hooks
export function useSystemPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: settingsKeys.preferences(),
    queryFn: () => SettingsService.getPreferences(),
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<SystemPreferences>) => SettingsService.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.preferences() });
    },
  });

  return {
    ...query,
    updatePreferences: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}

// API Keys Hooks
export function useApiKeys() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: settingsKeys.apiKeys(),
    queryFn: () => SettingsService.getApiKeys(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateApiKeyDto) => SettingsService.createApiKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.apiKeys() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => SettingsService.deleteApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.apiKeys() });
    },
  });

  return {
    ...query,
    createApiKey: createMutation.mutate,
    deleteApiKey: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Webhooks Hooks
export function useWebhooks() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: settingsKeys.webhooks(),
    queryFn: () => SettingsService.getWebhooks(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateWebhookDto) => SettingsService.createWebhook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.webhooks() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWebhookDto> }) =>
      SettingsService.updateWebhook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.webhooks() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => SettingsService.deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.webhooks() });
    },
  });

  return {
    ...query,
    createWebhook: createMutation.mutate,
    updateWebhook: updateMutation.mutate,
    deleteWebhook: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Notification Settings Hooks
export function useNotificationSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: settingsKeys.notifications(),
    queryFn: () => SettingsService.getNotificationSettings(),
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<NotificationSettings>) => SettingsService.updateNotificationSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.notifications() });
    },
  });

  return {
    ...query,
    updateSettings: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}

// System Logs Hooks
export function useSystemLogs(params?: {
  level?: "info" | "warn" | "error";
  category?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: settingsKeys.log(params || {}),
    queryFn: () => SettingsService.getLogs(params),
  });
}