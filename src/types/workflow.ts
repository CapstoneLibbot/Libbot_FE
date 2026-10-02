export const WorkflowStatus = {
  Draft: 1,
  Active: 2,
  Inactive: 3,
} as const

export type WorkflowStatus = (typeof WorkflowStatus)[keyof typeof WorkflowStatus]