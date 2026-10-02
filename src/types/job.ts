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

export type JobRecord = {
  id: number
  workflowId: number
  createdBy: number
  robotId: number | null
  name: string
  priority: JobPriority
  status: JobStatus
}