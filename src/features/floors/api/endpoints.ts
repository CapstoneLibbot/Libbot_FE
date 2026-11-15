export const FLOOR_ENDPOINTS = {
  LIST: '/floors',
  ALL: '/floors/all',
  DETAIL: (id: string) => `/floors/${encodeURIComponent(id)}`,
} as const
