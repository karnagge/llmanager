import { api } from "@/lib/api";
import { User } from "@/lib/types";
import { UserFormData } from "@/lib/schemas/user";
import { ApiResponse, PaginatedResponse } from "@/lib/types";

export class UserService {
  private static readonly BASE_PATH = "/users";

  static async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<User>>> {
    return api.get<PaginatedResponse<User>>(this.BASE_PATH, params);
  }

  static async create(data: UserFormData): Promise<ApiResponse<User>> {
    return api.post<User>(this.BASE_PATH, data as Record<string, unknown>);
  }

  static async update(
    userId: string,
    data: UserFormData
  ): Promise<ApiResponse<User>> {
    return api.put<User>(`${this.BASE_PATH}/${userId}`, data as Record<string, unknown>);
  }

  static async delete(userId: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`${this.BASE_PATH}/${userId}`);
  }

  static async getById(userId: string): Promise<ApiResponse<User>> {
    return api.get<User>(`${this.BASE_PATH}/${userId}`);
  }
}