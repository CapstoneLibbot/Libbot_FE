import axios from 'axios'
import type { BaseResponse } from '@/types/api'

export class ApiError extends Error {
  statusCode: number
  success: boolean

  constructor(message: string, statusCode = 500) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.success = false
  }
}

/**
 * Rút trích message chuẩn xác để hiển thị thông báo (Toast/Alert) trên UI
 */
export function getErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.'): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (axios.isAxiosError<BaseResponse<unknown>>(error)) {
    const resData = error.response?.data
    // 1. Backend trả về BaseResponse có chứa message (400, 404, validation error...)
    if (resData && typeof resData === 'object' && 'message' in resData && resData.message) {
      return resData.message
    }

    // 2. Trường hợp lỗi hệ thống từ ExceptionMiddleware (500)
    if (resData && typeof resData === 'object' && 'error' in resData && typeof (resData as { error?: unknown }).error === 'string') {
      return (resData as { error: string }).error
    }

    if (error.response?.status === 404) return 'Không tìm thấy dữ liệu yêu cầu (404)'
    if (error.response?.status === 500) return 'Máy chủ gặp sự cố nội bộ (500)'
  }

  return error instanceof Error ? error.message : fallback
}
