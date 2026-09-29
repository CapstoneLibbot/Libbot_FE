import { MissionPriority, MissionStatus } from '../../../types/common';

export interface Mission {
  id: string;
  workflowId: string;
  workflowName: string;
  robotId?: string;
  robotName?: string;
  status: MissionStatus;
  priority: MissionPriority;
  currentStep?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface MissionCreateRequest {
  workflowId: string;
  robotId?: string;
  priority: MissionPriority;
}

export interface MissionPreviewRequest {
  workflowId: string;
  robotId?: string;
  mapId?: string;
}
