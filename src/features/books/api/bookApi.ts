import { httpClient } from '@/services/http/client'
import { BOOK_ENDPOINTS } from './endpoints'
import type { PaginatedData } from '@/types/api'
import type {
  BookCategoryRecord,
  BookCategoryWriteRequest,
  BookQueryParams,
  BookRecord,
  BookWriteRequest,
} from '../types/book'

export const bookApi = {
  /** Lấy danh sách sách có phân trang và lọc */
  getBooks: (params?: BookQueryParams): Promise<PaginatedData<BookRecord>> => {
    return httpClient.get<PaginatedData<BookRecord>>(BOOK_ENDPOINTS.LIST, { params })
  },

  /** Xem chi tiết 1 cuốn sách (kèm danh mục hoặc bản sách nếu backend expand) */
  getBookById: (id: string, expand?: string): Promise<BookRecord> => {
    return httpClient.get<BookRecord>(BOOK_ENDPOINTS.DETAIL(id), {
      params: expand ? { expand } : undefined,
    })
  },

  /** Tạo sách mới */
  createBook: (payload: BookWriteRequest): Promise<BookRecord> => {
    return httpClient.post<BookRecord>(BOOK_ENDPOINTS.LIST, payload)
  },

  /** Cập nhật thông tin sách */
  updateBook: (id: string, payload: BookWriteRequest): Promise<BookRecord> => {
    return httpClient.put<BookRecord>(BOOK_ENDPOINTS.DETAIL(id), payload)
  },

  /** Xóa sách */
  deleteBook: (id: string): Promise<void> => {
    return httpClient.delete<void>(BOOK_ENDPOINTS.DETAIL(id))
  },

  /** Lấy danh sách toàn bộ danh mục sách */
  getCategories: (): Promise<BookCategoryRecord[]> => {
    return httpClient.get<BookCategoryRecord[]>(BOOK_ENDPOINTS.CATEGORIES)
  },

  /** Xem chi tiết một thể loại sách */
  getCategoryById: (id: string): Promise<BookCategoryRecord> => {
    return httpClient.get<BookCategoryRecord>(BOOK_ENDPOINTS.CATEGORY_DETAIL(id))
  },

  /** Tạo danh mục sách mới */
  createCategory: (payload: BookCategoryWriteRequest): Promise<BookCategoryRecord> => {
    return httpClient.post<BookCategoryRecord>(BOOK_ENDPOINTS.CATEGORIES, payload)
  },

  /** Cập nhật danh mục sách */
  updateCategory: (
    id: string,
    payload: BookCategoryWriteRequest,
  ): Promise<BookCategoryRecord> => {
    return httpClient.put<BookCategoryRecord>(BOOK_ENDPOINTS.CATEGORY_DETAIL(id), payload)
  },

  /** Xóa danh mục sách */
  deleteCategory: (id: string): Promise<void> => {
    return httpClient.delete<void>(BOOK_ENDPOINTS.CATEGORY_DETAIL(id))
  },
}
