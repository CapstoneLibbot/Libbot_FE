import { apiClient } from '@/features/maps/api/runtimeApi'

export type WorkflowStepType =
  | 'MOVE'
  | 'SCAN'
  | 'PROCESS_DATA'
  | 'EVALUATE'
  | 'DISPLAY'
  | 'WAIT'
  | 'NOTIFY'
  | 'END'

export type WorkflowStepWrite = {
  sequence: number
  id?: string
  type: WorkflowStepType
  name: string
  description?: string
  configuration: Record<string, unknown>
}

export type WorkflowTaskWrite = {
  sequence: number
  name: string
  description: string
  steps: WorkflowStepWrite[]
}

export type WorkflowWrite = {
  name: string
  description: string
  type: string
  isActive: boolean
  tasks: WorkflowTaskWrite[]
}

export type WorkflowStepRecord = {
  id: string
  sequence: number
  type: WorkflowStepType | string
  name: string
  description?: string | null
  configuration: Record<string, unknown> | null
}

export type WorkflowTaskRecord = {
  id: string
  sequence: number
  name: string
  description: string | null
  steps: WorkflowStepRecord[]
}

export type WorkflowRecord = {
  id: string
  name: string
  description: string | null
  type: string
  isActive: boolean
  tasks: WorkflowTaskRecord[]
  steps: WorkflowStepRecord[]
}

export async function getWorkflowsFromApi(): Promise<WorkflowRecord[]> {
  return (await apiClient.get<WorkflowRecord[]>('/workflows')).data
}

export async function getWorkflowFromApi(id: string): Promise<WorkflowRecord> {
  return (await apiClient.get<WorkflowRecord>(`/workflows/${encodeURIComponent(id)}`)).data
}

export async function createWorkflowInApi(workflow: WorkflowWrite): Promise<WorkflowRecord> {
  return (await apiClient.post<WorkflowRecord>('/workflows', workflow)).data
}
