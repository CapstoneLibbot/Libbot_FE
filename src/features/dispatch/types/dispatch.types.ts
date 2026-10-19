import { MissionPriority } from '../../../types/common';
import { PathPoint } from '../../../types/map';
import { WorkflowStep } from '../../workflows/types/workflow.types';

export interface DispatchRequest {
  workflowId: string;
  robotId?: string;
  priority: MissionPriority;
  runtimeId: 'sim' | 'real';
  initialContext?: Record<string, unknown>;
}

export interface DispatchPreview {
  workflowId: string;
  robotId: string;
  path: PathPoint[];
  steps: WorkflowStep[];
  estimatedDistance: number;
  estimatedDuration: number;
}

export interface DispatchPreviewRequest {
  workflowId: string;
  robotId?: string;
  mapId?: string;
}
