export const SHELF_ENDPOINTS = {
  LIST: '/shelves',
  ALL: '/shelves/all',
  DETAIL: (id: string) => `/shelves/${encodeURIComponent(id)}`,
  LEVELS_BY_SHELF: (shelfId: string) => `/shelves/${encodeURIComponent(shelfId)}/levels`,
  LEVEL_DETAIL: (levelId: string) => `/shelf-levels/${encodeURIComponent(levelId)}`,
  ENDPOINTS_LIST: '/endpoints',
} as const
