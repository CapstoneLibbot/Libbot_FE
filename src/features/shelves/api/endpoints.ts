export const SHELF_ENDPOINTS = {
  LIST: '/shelves',
  ALL: '/shelves/all',
  DETAIL: (id: string) => `/shelves/${encodeURIComponent(id)}`,
  LEVELS: '/shelf-levels',
  LEVEL_DETAIL: (levelId: string) => `/shelf-levels/${encodeURIComponent(levelId)}`,
  ENDPOINTS_LIST: '/endpoints',
} as const
