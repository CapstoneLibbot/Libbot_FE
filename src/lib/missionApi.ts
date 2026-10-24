const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5205').replace(/\/$/, '')

export type BackendMission = {
  id: string
  workflowId: string | null
  workflowName: string
  description: string
  status: string
  priority: string
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  robotId: string | null
  robotName: string | null
  runtimeId: string | null
}

export type BackendWorkflowStep = {
  id: string
  sequence: number
  type: string
  name: string
  configuration: Record<string, unknown> | null
}

export type BackendWorkflow = {
  id: string
  name: string
  description: string
  type: string
  isActive: boolean
  steps: BackendWorkflowStep[]
}

export type MissionExecutionState = {
  missionId?: string
  executionId?: string | null
  runtimeId?: string | null
  status: string
  currentStep?: string | null
  currentStepName?: string | null
  currentStepType?: string | null
  expectedEventType?: string | null
  expectedBookId?: string | null
  allowedValues?: string[]
  error?: string | null
  updatedAt?: string
}

export type RobotRuntime = {
  id: string
  displayName: string
  connected: boolean
  stale: boolean
  telemetry: {
    pose: { x: number; y: number; yaw: number }
    plannedPath: { x: number; y: number }[] | null
    battery: number | null
    navigationState: string
  } | null
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal })
  if (!response.ok) throw new Error(`Backend returned HTTP ${response.status}`)
  return response.json() as Promise<T>
}

export async function apiPost<T>(path: string, body: unknown = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }
  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null && 'message' in payload
      ? String(payload.message)
      : typeof payload === 'string' && payload.trim()
        ? payload
        : `Backend returned HTTP ${response.status}`
    throw new Error(message)
  }
  return payload as T
}
