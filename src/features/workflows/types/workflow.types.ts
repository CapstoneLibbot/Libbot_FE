import { MissionPriority } from '../../../types/common';

export enum WorkflowStepType {
  MOVE = 'MOVE',
  SCAN = 'SCAN',
  PROCESS_DATA = 'PROCESS_DATA',
  EVALUATE = 'EVALUATE',
  DISPLAY = 'DISPLAY',
  WAIT = 'WAIT',
  NOTIFY = 'NOTIFY'
}

export interface WorkflowStep {
  id: string;
  sequence: number;
  type: WorkflowStepType;
  name: string;
  configuration?: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  type: string;
  isActive: boolean;
  steps: WorkflowStep[];
}

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface WorkflowCreateRequest {
  name: string;
  description?: string;
  type: string;
  steps: WorkflowStep[];
}

export interface WorkflowDispatchConfig {
  priority: MissionPriority;
  requiredMapId?: string;
  notes?: string;
}
