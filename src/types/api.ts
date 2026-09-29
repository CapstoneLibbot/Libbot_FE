export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiErrorShape {
  message: string;
  status?: number;
  code?: string;
}
