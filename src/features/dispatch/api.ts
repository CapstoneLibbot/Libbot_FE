import axios from 'axios'

import { apiClient } from '../maps/api/runtimeApi'
import type {
  CreateMissionInput,
  DispatchWorkflow,
  Mission,
  MissionExecution,
} from './types'

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (typeof data === 'string' && data.trim()) return data
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') return data.message
    if (data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string') return data.detail
  }
  return error instanceof Error ? error.message : fallback
}

export async function getDispatchWorkflows(): Promise<DispatchWorkflow[]> {
  return (await apiClient.get<DispatchWorkflow[]>('/workflows')).data
}

export async function createMission(input: CreateMissionInput): Promise<Mission> {
  return (await apiClient.post<Mission>('/missions', input)).data
}

export async function startMission(
  missionId: string,
  runtimeId: CreateMissionInput['runtimeId'],
  armLeaseId?: string | null,
): Promise<void> {
  await apiClient.post(`/missions/${encodeURIComponent(missionId)}/start`, {
    runtimeId,
    armLeaseId,
  })
}

export async function getMissionExecution(missionId: string): Promise<MissionExecution> {
  return (await apiClient.get<MissionExecution>(`/missions/${encodeURIComponent(missionId)}/execution`)).data
}

export async function cancelMission(missionId: string): Promise<void> {
  await apiClient.post(`/missions/${encodeURIComponent(missionId)}/cancel`)
}

export async function submitMissionEvent(
  missionId: string,
  eventType: string,
  data: unknown,
): Promise<void> {
  await apiClient.post(`/missions/${encodeURIComponent(missionId)}/execution/events`, {
    eventType,
    data,
  })
}
