export const BOOK_ENDPOINTS = {
  LIST: '/books',
  DETAIL: (id: string) => `/books/${encodeURIComponent(id)}`,
  CATEGORIES: '/books/categories',
  CATEGORY_DETAIL: (id: string) => `/books/categories/${encodeURIComponent(id)}`,
} as const
