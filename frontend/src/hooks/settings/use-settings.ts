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

  const query = useQuery<SystemPreferences>({
    queryKey: settingsKeys.preferences(),
    queryFn: () => SettingsService.getPreferences(),
  });

  const mutation = useMutation<SystemPreferences, Error, Partial<SystemPreferences>>({
    mutationFn: (data) => SettingsService.updatePreferences(data),
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

  const query = useQuery<ApiKey[]>({
    queryKey: settingsKeys.apiKeys(),
    queryFn: () => SettingsService.getApiKeys(),
  });

  const createMutation = useMutation<ApiKey, Error, CreateApiKeyDto>({
    mutationFn: (data) => SettingsService.createApiKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.apiKeys() });
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (id) => SettingsService.deleteApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.apiKeys() });
    },
  });

  return {
    ...query,
    createApiKey: createMutation.mutateAsync,
    deleteApiKey: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Webhooks Hooks
export function useWebhooks() {
  const queryClient = useQueryClient();

  const query = useQuery<Webhook[]>({
    queryKey: settingsKeys.webhooks(),
    queryFn: () => SettingsService.getWebhooks(),
  });

  const createMutation = useMutation<Webhook, Error, CreateWebhookDto>({
    mutationFn: (data) => SettingsService.createWebhook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.webhooks() });
    },
  });

  const updateMutation = useMutation<
    Webhook,
    Error,
    { id: string; data: Partial<CreateWebhookDto> }
  >({
    mutationFn: ({ id, data }) => SettingsService.updateWebhook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.webhooks() });
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: (id) => SettingsService.deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.webhooks() });
    },
  });

  return {
    ...query,
    createWebhook: createMutation.mutateAsync,
    updateWebhook: updateMutation.mutateAsync,
    deleteWebhook: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// Notification Settings Hooks
export function useNotificationSettings() {
  const queryClient = useQueryClient();

  const query = useQuery<NotificationSettings>({
    queryKey: settingsKeys.notifications(),
    queryFn: () => SettingsService.getNotificationSettings(),
  });

  const mutation = useMutation<NotificationSettings, Error, Partial<NotificationSettings>>({
    mutationFn: (data) => SettingsService.updateNotificationSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.notifications() });
    },
  });

  return {
    ...query,
    updateSettings: mutation.mutateAsync,
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
  return useQuery<{ logs: SystemLog[]; total: number }>({
    queryKey: settingsKeys.log(params || {}),
    queryFn: () => SettingsService.getLogs(params),
  });
}