import axios from 'axios'

import type {
  LiveOccupancyGrid,
  RobotRuntime,
  SavedMap,
} from '../types/runtime'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function getRobotRuntimes(): Promise<RobotRuntime[]> {
  return (await apiClient.get<RobotRuntime[]>('/robot-runtimes')).data
}

export async function getLatestRobotMapGrid(): Promise<LiveOccupancyGrid | null> {
  const response = await apiClient.get<LiveOccupancyGrid | null>(
    '/robot-runtimes/real/map',
  )

  return response.status === 204 ? null : response.data
}

export function getCameraStreamUrl(runtimeId: string, attempt = 0): string {
  const baseUrl = apiClient.defaults.baseURL ?? '/api'
  const url = new URL(
    `${baseUrl.replace(/\/$/, '')}/robot-runtimes/${encodeURIComponent(runtimeId)}/camera/stream`,
    window.location.href,
  )

  url.searchParams.set('v', String(attempt))
  return url.toString()
}

export async function armRuntime(runtimeId: string) {
  return (
    await apiClient.post<{
      runtimeId: string
      leaseId: string
      expiresAt: string
    }>(`/robot-runtimes/${runtimeId}/arm`)
  ).data
}

export async function disarmRuntime(runtimeId: string): Promise<void> {
  await apiClient.delete(`/robot-runtimes/${runtimeId}/arm`)
}

export async function sendManualVelocity(
  runtimeId: string,
  velocity: {
    linearX: number
    linearY: number
    angularZ: number
  },
  armLeaseId: string,
) {
  await apiClient.post(`/robot-runtimes/${runtimeId}/manual-velocity`, {
    ...velocity,
    armLeaseId,
  })
}

export type ManualStopResponse = {
  navigation_active?: boolean
  navigation_restarted?: boolean
}

export async function stopManual(
  runtimeId: string,
  resumeNavigation = false,
): Promise<ManualStopResponse> {
  const response = await apiClient.post<ManualStopResponse>(
    `/robot-runtimes/${runtimeId}/manual-stop`,
    null,
    {
      params: resumeNavigation ? { resumeNavigation: true } : undefined,
    },
  )

  return response.data
}

export async function setMapping(
  runtimeId: string,
  enabled: boolean,
  armLeaseId?: string | null,
) {
  await apiClient.post(`/robot-runtimes/${runtimeId}/mapping`, null, {
    params: {
      enabled,
      armLeaseId: armLeaseId || undefined,
    },
  })
}

export async function saveRobotMap(
  name: string,
  armLeaseId: string,
): Promise<SavedMap> {
  return (
    await apiClient.post<SavedMap>(
      '/robot-runtimes/real/maps',
      { name },
      { params: { armLeaseId } },
    )
  ).data
}

export async function getSavedMaps(): Promise<SavedMap[]> {
  return (
    await apiClient.get<SavedMap[]>('/robot-runtimes/real/maps')
  ).data
}

export async function getSavedRobotMapGrid(
  mapId: string,
): Promise<LiveOccupancyGrid> {
  const response = await apiClient.get<{
    width: number
    height: number
    data?: {
      format?: string
      resolution?: number
      origin?: unknown
      timestamp?: string
      cells?: unknown
    } | null
  }>(`/maps/${encodeURIComponent(mapId)}`)

  const saved = response.data
  const origin = saved.data?.origin
  const cells = saved.data?.cells

  if (
    saved.data?.format !== 'occupancy-grid-v1' ||
    typeof saved.data.resolution !== 'number' ||
    !Array.isArray(origin) ||
    origin.length < 3 ||
    !origin.every((value) => typeof value === 'number') ||
    !Array.isArray(cells) ||
    cells.length !== saved.width * saved.height ||
    !cells.every((value) => typeof value === 'number')
  ) {
    throw new Error('Backend trả về dữ liệu map không hợp lệ.')
  }

  return {
    timestamp: saved.data.timestamp ?? new Date().toISOString(),
    width: saved.width,
    height: saved.height,
    resolution: saved.data.resolution,
    originX: origin[0],
    originY: origin[1],
    originYaw: origin[2],
    data: cells,
  }
}

export async function startNavigationMode(
  mapId: string,
  armLeaseId: string,
) {
  await apiClient.post(`/maps/${encodeURIComponent(mapId)}/start-navigation`, null, {
    params: { armLeaseId },
    timeout: 75000,
  })
}

export async function stopNavigationMode() {
  await apiClient.delete('/robot-runtimes/real/navigation-mode')
}
