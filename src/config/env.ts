export const ENV = {
  // Mặc định '/api' để khớp với server.proxy trong vite.config.ts
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api',
  SIGNALR_URL: import.meta.env.VITE_SIGNALR_URL || '/robotHub',
  IS_DEV: import.meta.env.DEV,
} as const
