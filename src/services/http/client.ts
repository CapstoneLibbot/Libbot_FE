import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ENV } from '@/config/env'
import { ApiError } from './error'
import type { BaseResponse } from '@/types/api'

export interface AppHttpClient extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete'> {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
  raw: AxiosInstance
}

const rawAxios = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request Interceptor: Tự động đính kèm Token xác thực và chuẩn hóa URL prefix
rawAxios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('/api/')) {
    config.url = config.url.slice(4) // Tránh lặp /api/api khi baseURL đã có /api
  }
  const token = localStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response Interceptor: Tự động unwrap BaseResponse (hỗ trợ cả camelCase và PascalCase từ backend .NET)
rawAxios.interceptors.response.use(
  (response: AxiosResponse<BaseResponse<unknown>>) => {
    const payload = response.data as any

    // Nếu dữ liệu trả về theo format BaseResponse chuẩn (Success / success)
    if (payload && typeof payload === 'object' && ('success' in payload || 'Success' in payload)) {
      const isSuccess = 'success' in payload ? payload.success : payload.Success
      if (!isSuccess) {
        const msg = ('message' in payload ? payload.message : payload.Message) || 'Request failed'
        throw new ApiError(msg, response.status)
      }
      // Trả về trực tiếp phần payload.data / payload.Data
      return ('data' in payload ? payload.data : payload.Data) as any
    }

    // Trường hợp raw binary, blob, camera stream...
    return response.data
  },
  (error) => {
    if (axios.isAxiosError<BaseResponse<unknown>>(error)) {
      const serverMsg =
        error.response?.data?.message ||
        (error.response?.data as { error?: string })?.error ||
        'Lỗi kết nối máy chủ'
      return Promise.reject(new ApiError(serverMsg, error.response?.status ?? 500))
    }
    return Promise.reject(new ApiError(error.message || 'Lỗi không xác định'))
  },
)

const client = rawAxios as unknown as AppHttpClient
client.raw = rawAxios

export const httpClient = client
