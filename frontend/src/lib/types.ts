export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  quotaLimit: number;
  quotaUsed: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Quota {
  id: string;
  tenantId: string;
  limit: number;
  used: number;
  period: 'DAILY' | 'MONTHLY' | 'YEARLY';
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  tenantId: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}