export const AISLE_ENDPOINTS = {
  LIST: '/aisles',
  ALL: '/aisles/all',
  DETAIL: (id: string) => `/aisles/${encodeURIComponent(id)}`,
} as const
