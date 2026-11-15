/**
 * Định dạng phản hồi chuẩn từ Backend .NET (BaseResponse.cs)
 */
export interface BaseResponse<T> {
  success: boolean
  message: string | null
  data: T
}

/**
 * Định dạng chuẩn cho dữ liệu danh sách có phân trang (BookListResponse.cs)
 */
export interface PaginatedData<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  sortBy: string
  sortOrder: 'asc' | 'desc' | string
}

/**
 * Query params chuẩn khi gửi yêu cầu phân trang lên server
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
  searchTerm?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
