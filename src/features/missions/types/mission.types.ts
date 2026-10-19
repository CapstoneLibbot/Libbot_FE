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
  runtimeId?: 'sim' | 'real';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface MissionCreateRequest {
  workflowId: string;
  robotId?: string;
  priority: MissionPriority;
  runtimeId?: 'sim' | 'real';
  initialContext?: Record<string, unknown>;
}

export interface MissionExecution {
  missionId: string;
  executionId?: string;
  runtimeId: string;
  status: string;
  currentStep?: string;
  currentStepName?: string;
  currentStepType?: string;
  expectedEventType?: string;
  allowedValues?: string[];
  result?: any;
  error?: string;
  updatedAt?: string;
}

export interface MissionPreviewRequest {
  workflowId: string;
  robotId?: string;
  mapId?: string;
}
