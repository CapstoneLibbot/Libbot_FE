import { axiosClient } from '../../../services/api/axiosClient';
import { Mission, MissionCreateRequest, MissionPreviewRequest } from '../types/mission.types';
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
