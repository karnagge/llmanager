import { api } from "@/lib/api";

export interface SystemPreferences {
  name: string;
  description?: string;
  defaultQuota: number;
  maxTokensPerRequest: number;
  allowNewRegistrations: boolean;
  requireEmailVerification: boolean;
  theme: "light" | "dark" | "system";
  dateFormat: string;
  timeZone: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
  scopes: string[];
  createdBy: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  createdAt: string;
  createdBy: string;
  lastTriggered?: string;
  failureCount: number;
}

export interface NotificationSettings {
  email: {
    enabled: boolean;
    recipients: string[];
    quotaAlerts: boolean;
    systemAlerts: boolean;
    weeklyReports: boolean;
  };
  slack: {
    enabled: boolean;
    webhookUrl?: string;
    channel?: string;
    quotaAlerts: boolean;
    systemAlerts: boolean;
  };
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  category: string;
  message: string;
  details?: Record<string, any>;
  user?: string;
}

export interface CreateApiKeyDto {
  name: string;
  expiresAt?: string;
  scopes: string[];
}

export interface CreateWebhookDto {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active?: boolean;
}

export interface UpdateWebhookDto extends Partial<CreateWebhookDto> {
  active?: boolean;
}

export class SettingsService {
  private static readonly basePath = "/api/settings";

  /**
   * Get system preferences
   */
  static async getPreferences(): Promise<SystemPreferences> {
    const response = await api.get<SystemPreferences>(`${this.basePath}/preferences`);
    return response.data;
  }

  /**
   * Update system preferences
   */
  static async updatePreferences(preferences: Partial<SystemPreferences>): Promise<SystemPreferences> {
    const response = await api.patch<SystemPreferences>(`${this.basePath}/preferences`, preferences);
    return response.data;
  }

  /**
   * Get API keys
   */
  static async getApiKeys(): Promise<ApiKey[]> {
    const response = await api.get<ApiKey[]>(`${this.basePath}/api-keys`);
    return response.data;
  }

  /**
   * Create API key
   */
  static async createApiKey(data: CreateApiKeyDto): Promise<ApiKey> {
    const response = await api.post<ApiKey>(`${this.basePath}/api-keys`, data);
    return response.data;
  }

  /**
   * Delete API key
   */
  static async deleteApiKey(id: string): Promise<void> {
    await api.delete(`${this.basePath}/api-keys/${id}`);
  }

  /**
   * Get webhooks
   */
  static async getWebhooks(): Promise<Webhook[]> {
    const response = await api.get<Webhook[]>(`${this.basePath}/webhooks`);
    return response.data;
  }

  /**
   * Create webhook
   */
  static async createWebhook(data: CreateWebhookDto): Promise<Webhook> {
    const response = await api.post<Webhook>(`${this.basePath}/webhooks`, data);
    return response.data;
  }

  /**
   * Update webhook
   */
  static async updateWebhook(id: string, data: UpdateWebhookDto): Promise<Webhook> {
    const response = await api.patch<Webhook>(`${this.basePath}/webhooks/${id}`, data);
    return response.data;
  }

  /**
   * Delete webhook
   */
  static async deleteWebhook(id: string): Promise<void> {
    await api.delete(`${this.basePath}/webhooks/${id}`);
  }

  /**
   * Get notification settings
   */
  static async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await api.get<NotificationSettings>(`${this.basePath}/notifications`);
    return response.data;
  }

  /**
   * Update notification settings
   */
  static async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await api.patch<NotificationSettings>(`${this.basePath}/notifications`, settings);
    return response.data;
  }

  /**
   * Get system logs
   */
  static async getLogs(params?: {
    level?: "info" | "warn" | "error";
    category?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: SystemLog[]; total: number }> {
    const response = await api.get<{ logs: SystemLog[]; total: number }>(`${this.basePath}/logs`, {
      params,
    });
    return response.data;
  }
}