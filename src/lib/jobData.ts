import { JobPriority, JobStatus, type JobRecord } from '@/types/job'

export const sampleJobs: JobRecord[] = [
  {
    id: 1001,
    workflowId: 1,
    createdBy: 1,
    robotId: 12,
    name: 'Find and guide to a book',
    priority: JobPriority.High,
    status: JobStatus.Running,
  },
  {
    id: 1002,
    workflowId: 2,
    createdBy: 1,
    robotId: null,
    name: 'Guide visitor to a facility',
    priority: JobPriority.Normal,
    status: JobStatus.Pending,
  },
  {
    id: 1003,
    workflowId: 3,
    createdBy: 2,
    robotId: 8,
    name: 'Run bookshelf inventory',
    priority: JobPriority.Critical,
    status: JobStatus.Failed,
  },
  {
    id: 1004,
    workflowId: 4,
    createdBy: 2,
    robotId: 15,
    name: 'Complete library patrol',
    priority: JobPriority.Low,
    status: JobStatus.Completed,
  },
  {
    id: 1005,
    workflowId: 5,
    createdBy: 1,
    robotId: null,
    name: 'Return robot to charging station',
    priority: JobPriority.Normal,
    status: JobStatus.Cancelled,
  },
]