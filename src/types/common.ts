export type Mode = 'SIMULATION' | 'LIVE';
export type MissionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MissionStatus =
  | 'QUEUED'
  | 'ASSIGNED'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info';

export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}
