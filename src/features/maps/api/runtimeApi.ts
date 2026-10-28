import axios from 'axios'

import type {
  LiveOccupancyGrid,
  Pose2D,
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

export async function setInitialPose(
  runtimeId: string,
  pose: Pose2D,
  armLeaseId?: string | null,
): Promise<void> {
  await apiClient.post(`/robot-runtimes/${encodeURIComponent(runtimeId)}/initial-pose`, {
    ...pose,
    armLeaseId,
  })
}

export async function sendNavigationGoal(
  runtimeId: string,
  pose: Pose2D,
  armLeaseId?: string | null,
) {
  return (
    await apiClient.post<{
      runtimeId: string
      commandId: string
      status: string
    }>(`/robot-runtimes/${encodeURIComponent(runtimeId)}/navigation-goals`, {
      ...pose,
      armLeaseId,
      speedMode: 'NORMAL',
      obstaclePolicy: 'REROUTE',
      timeoutSec: 180,
    })
  ).data
}

export async function cancelNavigationGoal(
  runtimeId: string,
  commandId: string,
  armLeaseId?: string | null,
): Promise<void> {
  await apiClient.delete(
    `/robot-runtimes/${encodeURIComponent(runtimeId)}/navigation-goals/${encodeURIComponent(commandId)}`,
    { params: armLeaseId ? { armLeaseId } : undefined },
  )
}

export async function getLatestSavedRobotMap(): Promise<{
  id: string
  name: string
  version: string
} | null> {
  return (
    await apiClient.get<{
      id: string
      name: string
      version: string
    } | null>('/robot-runtimes/real/maps/latest')
  ).data
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

export type SavedRobotMapDetails = {
  map: SavedMap
  grid: LiveOccupancyGrid
}

export type SavedMapEndpoint = {
  id: string
  mapId: string
  name: string
  endpointType: 'WAYPOINT' | 'CHARGER' | 'PARK'
  positionX: number
  positionY: number
  theta: number
  isActive: boolean
}

export type SavedMapZone = {
  id: string
  mapId: string
  zoneType: string
  maxSpeed: number
  minX: number
  minY: number
  maxX: number
  maxY: number
  isActive: boolean
}

export type SavedMapEndpointGroup = {
  id: string
  name: string
}

export type SavedMapEndpointGroupMember = {
  id: string
  endpointGroupId: string
  endpointId: string
}

export async function getSavedMapEndpoints(mapId: string): Promise<SavedMapEndpoint[]> {
  return (await apiClient.get<SavedMapEndpoint[]>(`/maps/${encodeURIComponent(mapId)}/endpoints`)).data
}

export async function getSavedMapZones(mapId: string): Promise<SavedMapZone[]> {
  return (await apiClient.get<SavedMapZone[]>(`/maps/${encodeURIComponent(mapId)}/zones`)).data
}

export async function getSavedMapEndpointGroups(): Promise<SavedMapEndpointGroup[]> {
  return (await apiClient.get<SavedMapEndpointGroup[]>('/endpoint-groups')).data
}

export async function getSavedMapEndpointGroupMembers(): Promise<SavedMapEndpointGroupMember[]> {
  return (await apiClient.get<SavedMapEndpointGroupMember[]>('/endpoint-group-members')).data
}

export async function createSavedMapEndpoint(input: Omit<SavedMapEndpoint, 'id' | 'isActive'>): Promise<SavedMapEndpoint> {
  return (await apiClient.post<SavedMapEndpoint>('/endpoints', input)).data
}

export async function updateSavedMapEndpoint(id: string, input: Omit<SavedMapEndpoint, 'id'>): Promise<SavedMapEndpoint> {
  return (await apiClient.put<SavedMapEndpoint>(`/endpoints/${encodeURIComponent(id)}`, input)).data
}

export async function deleteSavedMapEndpoint(id: string): Promise<void> {
  await apiClient.delete(`/endpoints/${encodeURIComponent(id)}`)
}

export async function createSavedMapZone(input: Omit<SavedMapZone, 'id' | 'isActive'>): Promise<SavedMapZone> {
  return (await apiClient.post<SavedMapZone>('/zones', input)).data
}

export async function updateSavedMapZone(id: string, input: Omit<SavedMapZone, 'id'>): Promise<SavedMapZone> {
  return (await apiClient.put<SavedMapZone>(`/zones/${encodeURIComponent(id)}`, input)).data
}

export async function deleteSavedMapZone(id: string): Promise<void> {
  await apiClient.delete(`/zones/${encodeURIComponent(id)}`)
}

export async function getSavedRobotMapDetails(
  mapId: string,
): Promise<SavedRobotMapDetails> {
  const response = await apiClient.get<{
    id: string
    name: string
    version: string
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
    !Number.isInteger(saved.width) ||
    saved.width <= 0 ||
    !Number.isInteger(saved.height) ||
    saved.height <= 0 ||
    typeof saved.data.resolution !== 'number' ||
    saved.data.resolution <= 0 ||
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
    map: {
      id: saved.id,
      name: saved.name,
      version: saved.version,
      width: saved.width,
      height: saved.height,
      data: { format: saved.data.format },
    },
    grid: {
      timestamp: saved.data.timestamp ?? new Date().toISOString(),
      width: saved.width,
      height: saved.height,
      resolution: saved.data.resolution,
      originX: origin[0],
      originY: origin[1],
      originYaw: origin[2],
      data: cells,
    },
  }
}

export async function getSavedRobotMapGrid(
  mapId: string,
): Promise<LiveOccupancyGrid> {
  return (await getSavedRobotMapDetails(mapId)).grid
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
