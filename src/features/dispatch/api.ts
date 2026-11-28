import axios from 'axios'

import { apiClient } from '../maps/api/runtimeApi'
import type {
  CreateJobInput,
  DispatchWorkflow,
  Job,
  JobExecution,
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

export async function createJob(input: CreateJobInput): Promise<Job> {
  return (await apiClient.post<Job>('/jobs', input)).data
}

export async function startJob(
  jobId: string,
  runtimeId: CreateJobInput['runtimeId'],
  armLeaseId?: string | null,
): Promise<void> {
  await apiClient.post(`/jobs/${encodeURIComponent(jobId)}/start`, {
    runtimeId,
    armLeaseId,
  })
}

export async function getJobExecution(jobId: string): Promise<JobExecution> {
  return (await apiClient.get<JobExecution>(`/jobs/${encodeURIComponent(jobId)}/execution`)).data
}

export async function cancelJob(jobId: string): Promise<void> {
  await apiClient.post(`/jobs/${encodeURIComponent(jobId)}/cancel`)
}

export async function submitJobEvent(
  jobId: string,
  eventType: string,
  data: unknown,
): Promise<void> {
  await apiClient.post(`/jobs/${encodeURIComponent(jobId)}/execution/events`, {
    eventType,
    data,
  })
}
