import { axiosClient } from '../../../services/api/axiosClient';
import { DispatchPreview, DispatchPreviewRequest, DispatchRequest } from '../types/dispatch.types';
import { mockRobots, previewPath } from '../../../mockData';

export async function getRobots(): Promise<{ id: string; name: string; status: 'AVAILABLE' | 'BUSY' | 'OFFLINE'; battery: number; location: string }[]> {
  try {
    const response = await axiosClient.get('/robots');
    return response.data;
  } catch {
    return mockRobots;
  }
}

export async function getRobot(id: string) {
  try {
    const response = await axiosClient.get(`/robots/${id}`);
    return response.data;
  } catch {
    return mockRobots.find((robot) => robot.id === id) ?? null;
  }
}

export async function getMaps() {
  try {
    const response = await axiosClient.get('/maps');
    return response.data;
  } catch {
    return [
      { id: 'map-floor-1', name: 'Floor 1', width: 100, height: 80 },
      { id: 'map-floor-2', name: 'Floor 2', width: 110, height: 70 }
    ];
  }
}

export async function previewDispatch(payload: DispatchPreviewRequest): Promise<DispatchPreview> {
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

export async function dispatchWorkflow(payload: DispatchRequest) {
  try {
    const response = await axiosClient.post('/missions/dispatch', payload);
    return response.data;
  } catch {
    return {
      id: `mission-${Date.now()}`,
      workflowId: payload.workflowId,
      robotId: payload.robotId,
      priority: payload.priority,
      status: 'QUEUED',
      createdAt: new Date().toISOString()
    };
  }
}
