import { api } from "@/lib/api";
import { ApiResponse } from "@/lib/types";
import { toRecord } from "@/lib/utils/type-utils";

export interface QuotaLimit {
  id: string;
  tenantId: string;
  type: "TOKENS" | "REQUESTS";
  limit: number;
  period: "DAILY" | "MONTHLY" | "YEARLY";
  used: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuotaAlert {
  id: string;
  tenantId: string;
  quotaId: string;
  threshold: number;
  triggered: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuotaLimitDTO {
  type: QuotaLimit["type"];
  limit: number;
  period: QuotaLimit["period"];
}

export interface CreateQuotaAlertDTO {
  quotaId: string;
  threshold: number;
}

export interface QuotaUsage {
  used: number;
  total: number;
  period: QuotaLimit["period"];
  startDate: string;
  endDate: string;
  usage: Array<{
    date: string;
    value: number;
  }>;
}

export class QuotaService {
  private static readonly BASE_PATH = "/quotas";

  static async getLimits(): Promise<ApiResponse<QuotaLimit[]>> {
    return api.get<QuotaLimit[]>(`${this.BASE_PATH}/limits`);
  }

  static async createLimit(
    data: CreateQuotaLimitDTO
  ): Promise<ApiResponse<QuotaLimit>> {
    return api.post<QuotaLimit>(`${this.BASE_PATH}/limits`, toRecord(data));
  }

  static async updateLimit(
    limitId: string,
    data: Partial<CreateQuotaLimitDTO>
  ): Promise<ApiResponse<QuotaLimit>> {
    return api.put<QuotaLimit>(
      `${this.BASE_PATH}/limits/${limitId}`,
      toRecord(data)
    );
  }

  static async deleteLimit(limitId: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`${this.BASE_PATH}/limits/${limitId}`);
  }

  static async getAlerts(): Promise<ApiResponse<QuotaAlert[]>> {
    return api.get<QuotaAlert[]>(`${this.BASE_PATH}/alerts`);
  }

  static async createAlert(
    data: CreateQuotaAlertDTO
  ): Promise<ApiResponse<QuotaAlert>> {
    return api.post<QuotaAlert>(`${this.BASE_PATH}/alerts`, toRecord(data));
  }

  static async deleteAlert(alertId: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`${this.BASE_PATH}/alerts/${alertId}`);
  }

  static async getUsage(
    type: QuotaLimit["type"],
    period: QuotaLimit["period"]
  ): Promise<ApiResponse<QuotaUsage>> {
    return api.get<QuotaUsage>(`${this.BASE_PATH}/usage`, { type, period });
  }
}