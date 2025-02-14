import { api } from "@/lib/api";
import { ApiResponse } from "@/lib/types";
import { toRecord } from "@/lib/utils/type-utils";

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "USER";
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData extends LoginData {
  name: string;
}

export interface RefreshTokenResponse {
  token: string;
}

export class AuthService {
  private static readonly BASE_PATH = "/auth";

  static async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
    return api.post<AuthResponse>(`${this.BASE_PATH}/login`, toRecord(data));
  }

  static async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    return api.post<AuthResponse>(`${this.BASE_PATH}/register`, toRecord(data));
  }

  static async refreshToken(
    refreshToken: string
  ): Promise<ApiResponse<RefreshTokenResponse>> {
    return api.post<RefreshTokenResponse>(
      `${this.BASE_PATH}/refresh`,
      toRecord({ refreshToken })
    );
  }

  static async logout(): Promise<ApiResponse<void>> {
    return api.post<void>(`${this.BASE_PATH}/logout`, {});
  }

  static async me(): Promise<ApiResponse<AuthResponse["user"]>> {
    return api.get<AuthResponse["user"]>(`${this.BASE_PATH}/me`);
  }

  static setAuthToken(token: string): void {
    localStorage.setItem('token', token);
  }

  static getAuthToken(): string | null {
    return localStorage.getItem('token');
  }

  static removeAuthToken(): void {
    localStorage.removeItem('token');
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  static removeRefreshToken(): void {
    localStorage.removeItem('refreshToken');
  }

  static clearTokens(): void {
    this.removeAuthToken();
    this.removeRefreshToken();
  }
}