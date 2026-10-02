export const WorkflowStatus = {
  Draft: 1,
  Active: 2,
  Inactive: 3,
} as const

export type WorkflowStatus = (typeof WorkflowStatus)[keyof typeof WorkflowStatus]

export const WorkflowStepType = {
  Move: 'MOVE',
  Scan: 'SCAN',
  ProcessData: 'PROCESS_DATA',
  Evaluate: 'EVALUATE',
  Display: 'DISPLAY',
  Wait: 'WAIT',
  Notify: 'NOTIFY',
} as const

export type WorkflowStepType =
  (typeof WorkflowStepType)[keyof typeof WorkflowStepType]

export type WorkflowStepRecord = {
  id: number
  workflowTaskId: number
  name: string
  description: string
  sequenceNo: number
  stepType: WorkflowStepType
  createdAt: string
}

export type WorkflowTaskRecord = {
  id: number
  workflowId: number
  name: string
  description: string
  sequenceNo: number
  createdAt: string
  steps: WorkflowStepRecord[]
}

export type WorkflowRecord = {
  id: number
  name: string
  description: string
  status: WorkflowStatus
  createdAt: string
  tasks: WorkflowTaskRecord[]
}