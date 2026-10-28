export type DispatchRuntimeId = 'sim' | 'real'

export type DispatchWorkflowStep = {
  id: string
  sequence: number
  type: string
  name: string
  configuration?: Record<string, unknown> | null
}

export type DispatchWorkflow = {
  id: string
  name: string
  description: string
  type: string
  isActive: boolean
  steps: DispatchWorkflowStep[]
}

export type Mission = {
  id: string
  workflowId: string | null
  workflowName: string
  description: string
  status: string
  priority: string
  createdAt: string
  startedAt?: string | null
  completedAt?: string | null
  runtimeId?: DispatchRuntimeId | null
}

export type MissionExecution = {
  missionId: string
  executionId?: string
  runtimeId: DispatchRuntimeId
  status: string
  currentStep?: string | null
  currentStepName?: string | null
  currentStepType?: string | null
  expectedEventType?: string | null
  allowedValues?: string[]
  result?: Record<string, unknown> | null
  error?: string | null
  updatedAt?: string
}

export type CreateMissionInput = {
  workflowId: string
  priority: string
  runtimeId: DispatchRuntimeId
  initialContext: Record<string, unknown>
}
