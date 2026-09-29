import { axiosClient } from '../../../services/api/axiosClient';
import { Mission, MissionCreateRequest, MissionPreviewRequest } from '../types/mission.types';
import { mockMissions, previewPath } from '../../../mockData';
import { DispatchPreview } from '../../dispatch/types/dispatch.types';

export async function getMissions(): Promise<Mission[]> {
  try {
    const response = await axiosClient.get<Mission[]>('/missions');
    return response.data;
  } catch {
    return mockMissions;
  }
}

export async function getMission(id: string): Promise<Mission | null> {
  try {
    const response = await axiosClient.get<Mission>(`/missions/${id}`);
    return response.data;
  } catch {
    return mockMissions.find((mission) => mission.id === id) ?? null;
  }
}

export async function previewMission(payload: MissionPreviewRequest): Promise<DispatchPreview> {
  try {
    const response = await axiosClient.post<DispatchPreview>('/missions/preview', payload);
    return response.data;
  } catch {
    return {
      workflowId: payload.workflowId,
      robotId: payload.robotId ?? 'robot-001',
      path: previewPath,
      steps: [],
      estimatedDistance: 32.4,
      estimatedDuration: 155
    };
  }
}

export async function dispatchMission(payload: MissionCreateRequest): Promise<Mission> {
  try {
    const response = await axiosClient.post<Mission>('/missions/dispatch', payload);
    return response.data;
  } catch {
    const mission: Mission = {
      id: `mission-${Date.now()}`,
      workflowId: payload.workflowId,
      workflowName: 'Library Patrol',
      robotId: payload.robotId,
      robotName: 'LiBot-01',
      status: 'QUEUED',
      priority: payload.priority,
      createdAt: new Date().toISOString(),
      currentStep: 1
    };

    return mission;
  }
}
