import { axiosClient } from '../../../services/api/axiosClient';
import { Mission, MissionCreateRequest, MissionExecution, MissionPreviewRequest } from '../types/mission.types';
import { DispatchPreview } from '../../dispatch/types/dispatch.types';

export async function getMissions(): Promise<Mission[]> {
  const response = await axiosClient.get<Mission[]>('/missions');
  return response.data;
}

export async function getMission(id: string): Promise<Mission | null> {
  const response = await axiosClient.get<Mission>(`/missions/${id}`);
  return response.data;
}

export async function previewMission(payload: MissionPreviewRequest): Promise<DispatchPreview> {
  const response = await axiosClient.post<DispatchPreview>('/missions/preview', payload);
  return response.data;
}

export async function dispatchMission(payload: MissionCreateRequest): Promise<Mission> {
  const response = await axiosClient.post<Mission>('/missions', payload);
  return response.data;
}

export async function armRuntime(runtimeId: 'real' | 'sim'): Promise<{ runtimeId: string; armLeaseId: string }> {
  const response = await axiosClient.post<{ runtimeId: string; armLeaseId: string }>(`/robot-runtimes/${runtimeId}/arm`);
  return response.data;
}

export async function startMission(id: string, armLeaseId?: string): Promise<void> {
  await axiosClient.post(`/missions/${id}/start`, { armLeaseId });
}

export async function getMissionExecution(id: string): Promise<MissionExecution> {
  const response = await axiosClient.get<MissionExecution>(`/missions/${id}/execution`);
  return response.data;
}

export async function submitMissionExecutionEvent(id: string, eventType: string, data: unknown): Promise<void> {
  await axiosClient.post(`/missions/${id}/execution/events`, { eventType, data });
}

export async function cancelMission(id: string): Promise<void> {
  await axiosClient.post(`/missions/${id}/cancel`);
}

export async function updateMission(id: string, payload: MissionCreateRequest): Promise<Mission> {
  const response = await axiosClient.put<Mission>(`/missions/${id}`, payload);
  return response.data;
}

export async function deleteMission(id: string): Promise<void> {
  await axiosClient.delete(`/missions/${id}`);
}
