export type DispatchRuntimeId = 'sim' | 'real'

export type DispatchWorkflowStep = {
  id: string
  sequence: number
  type: string
  name: string
  configuration?: Record<string, unknown> | null
}

export type DispatchWorkflowTask = {
  id: string
  sequence: number
  name: string
  description?: string | null
  steps: DispatchWorkflowStep[]
}

export type DispatchWorkflow = {
  id: string
  name: string
  description: string
  type: string
  isActive: boolean
  tasks: DispatchWorkflowTask[]
  steps: DispatchWorkflowStep[]
}

export type Job = {
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

export type JobExecution = {
  jobId: string
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

export type AutoChargeStartedEvent = {
  jobId: string
  executionId?: string | null
  runtimeId: DispatchRuntimeId
  workflowId?: string | null
  batteryPercent: number
  chargerEndpointId?: string | null
  status?: string
  queued?: boolean
}

export type LibrarianNotificationEvent = {
  type: string
  runtimeId?: DispatchRuntimeId
  jobId?: string
  executionId?: string
  batteryPercent?: number
  message: string
  createdAt?: string
}

export type CreateJobInput = {
  workflowId: string
  priority: string
  runtimeId: DispatchRuntimeId
  initialContext: Record<string, unknown>
  name?: string
  description?: string
}
