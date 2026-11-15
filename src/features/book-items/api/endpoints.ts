export const BOOK_ITEM_ENDPOINTS = {
  LIST: '/book-items',
  DETAIL: (id: string) => `/book-items/${encodeURIComponent(id)}`,
} as const
