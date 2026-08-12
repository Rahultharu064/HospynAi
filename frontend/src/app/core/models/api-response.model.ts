export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message?: string;
  data: T;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  status: number;
  message?: string;
  data: T[];
  pagination: Pagination;
}

export interface ApiErrorBody {
  success: false;
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}
