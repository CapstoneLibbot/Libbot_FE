import type { WorkflowStepType } from '@/types/workflow'

export const JobStatus = {
  Pending: 'Pending',
  Running: 'Running',
  Completed: 'Completed',
  Failed: 'Failed',
  Cancelled: 'Cancelled',
} as const

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus]

export const JobPriority = {
  Low: 1,
  Normal: 2,
  High: 3,
  Critical: 4,
} as const

export type JobPriority = (typeof JobPriority)[keyof typeof JobPriority]

export type JobStepParameters = Record<string, unknown>

export type JobStepRecord = {
  id: number
  jobTaskId: number
  taskStepId: number
  name: string
  stepType: WorkflowStepType
  sequenceNo: number
  status: JobStatus
  description: string
  parameters: JobStepParameters
}

export type JobEventRecord = {
  id: number
  jobId: number
  eventType: string
  eventTime: string
  data: {
    taskSequenceNo: number
    taskName: string
    stepSequenceNo: number
    workflowTaskId: number
    taskStepId: number
    jobTaskId: number
    jobStepId: number
    stepName: string
    stepType: WorkflowStepType
    parameters: JobStepParameters
    result: Record<string, unknown>
  }
}

export type FeedbackRecord = {
  id: number
  jobId: number
  rating: number
  comment: string | null
}

export type InventoryReportRecord = {
  id: number
  jobId: number
  scopeType: string
  totalShelfs: number
  totalBookScanned: number
  totalAvailable: number
  totalMisplaced: number
  totalMissing: number
  createdAt: string
  data: {
    items: InventoryReportItem[]
  }
}

export type InventoryReportLocation = {
  floor: string
  aisle: string
  shelf: string
  shelfLevel: number
}

export type InventoryReportItem = {
  bookId: number
  title: string
  author: string
  classification: string
  issueType: 'MISPLACED' | 'MISSING'
  expectedLocation: InventoryReportLocation
  actualLocation: InventoryReportLocation | null
}

export type JobTaskRecord = {
  id: number
  jobId: number
  workflowTaskId: number
  name: string
  status: JobStatus
  startedAt: string | null
  completedAt: string | null
  description: string
  steps: JobStepRecord[]
}

export type JobRecord = {
  id: number
  workflowId: number
  createdBy: number
  robotId: number | null
  name: string
  priority: JobPriority
  status: JobStatus
  description: string
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  tasks: JobTaskRecord[]
}