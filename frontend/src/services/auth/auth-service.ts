import { api } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export class AuthService {
  private static readonly basePath = "/api/auth";

  /**
   * Login with email and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(`${this.basePath}/login`, credentials);
    return response.data;
  }

  /**
   * Register a new user
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(`${this.basePath}/register`, data);
    return response.data;
  }

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<User> {
    const response = await api.get<User>(`${this.basePath}/me`);
    return response.data;
  }

  /**
   * Logout current user
   */
  static async logout(): Promise<void> {
    await api.post(`${this.basePath}/logout`, {});
  }

  /**
   * Update current user profile
   */
  static async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch<User>(`${this.basePath}/me`, data);
    return response.data;
  }
}