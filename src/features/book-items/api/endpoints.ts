export const BOOK_ITEM_ENDPOINTS = {
  LIST: '/books/items',
  DETAIL: (id: string) => `/books/items/${encodeURIComponent(id)}`,
} as const
