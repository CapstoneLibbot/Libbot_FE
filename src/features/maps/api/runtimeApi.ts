import { axiosClient } from '../../../services/api/axiosClient';
import { LiveOccupancyGrid, Pose2D, RobotRuntime, SavedMap } from '../types/runtime';

export async function getRobotRuntimes(): Promise<RobotRuntime[]> {
  return (await axiosClient.get<RobotRuntime[]>('/robot-runtimes')).data;
}

export async function getLatestRobotMapGrid(): Promise<LiveOccupancyGrid | null> {
  const response = await axiosClient.get<LiveOccupancyGrid | null>('/robot-runtimes/real/map');
  return response.status === 204 ? null : response.data;
}

export async function armRuntime(runtimeId: string) {
  return (await axiosClient.post<{ runtimeId: string; leaseId: string; expiresAt: string }>(`/robot-runtimes/${runtimeId}/arm`)).data;
}

export async function disarmRuntime(runtimeId: string): Promise<void> {
  await axiosClient.delete(`/robot-runtimes/${runtimeId}/arm`);
}

export async function setInitialPose(runtimeId: string, pose: Pose2D, armLeaseId?: string | null): Promise<void> {
  await axiosClient.post(`/robot-runtimes/${runtimeId}/initial-pose`, { ...pose, armLeaseId });
}

export async function sendNavigationGoal(runtimeId: string, pose: Pose2D, armLeaseId?: string | null) {
  return (await axiosClient.post<{ runtimeId: string; commandId: string; status: string }>(
    `/robot-runtimes/${runtimeId}/navigation-goals`,
    { ...pose, armLeaseId, speedMode: 'NORMAL', obstaclePolicy: 'REROUTE', timeoutSec: 180 }
  )).data;
}

export async function cancelNavigationGoal(runtimeId: string, commandId: string, armLeaseId?: string | null): Promise<void> {
  await axiosClient.delete(`/robot-runtimes/${runtimeId}/navigation-goals/${commandId}`, {
    params: armLeaseId ? { armLeaseId } : undefined
  });
}

export async function sendManualVelocity(runtimeId: string, velocity: { linearX: number; linearY: number; angularZ: number }, armLeaseId: string) {
  await axiosClient.post(`/robot-runtimes/${runtimeId}/manual-velocity`, {
    linearX: velocity.linearX, linearY: velocity.linearY, angularZ: velocity.angularZ, armLeaseId
  });
}

export interface ManualStopResponse {
  navigation_active?: boolean;
  navigation_restarted?: boolean;
}

export async function stopManual(runtimeId: string, resumeNavigation = false): Promise<ManualStopResponse> {
  const response = await axiosClient.post<ManualStopResponse>(`/robot-runtimes/${runtimeId}/manual-stop`, null, {
    params: resumeNavigation ? { resumeNavigation: true } : undefined,
  });
  return response.data;
}

export async function setMapping(runtimeId: string, enabled: boolean, armLeaseId?: string | null) {
  await axiosClient.post(`/robot-runtimes/${runtimeId}/mapping`, null, { params: { enabled, armLeaseId: armLeaseId || undefined } });
}

export async function saveRobotMap(name: string, armLeaseId: string): Promise<SavedMap> {
  return (await axiosClient.post<SavedMap>('/robot-runtimes/real/maps', { name }, { params: { armLeaseId } })).data;
}

export async function getSavedMaps(): Promise<SavedMap[]> {
  return (await axiosClient.get<SavedMap[]>('/robot-runtimes/real/maps')).data;
}

export async function getLatestSavedRobotMap(): Promise<{ id: string; name: string; version: string } | null> {
  return (await axiosClient.get<{ id: string; name: string; version: string } | null>('/robot-runtimes/real/maps/latest')).data;
}

export async function getSavedRobotMapGrid(mapId: string): Promise<LiveOccupancyGrid> {
  const response = await axiosClient.get<{
    width: number;
    height: number;
    data?: {
      format?: string;
      resolution?: number;
      origin?: unknown;
      timestamp?: string;
      cells?: unknown;
    } | null;
  }>(`/maps/${encodeURIComponent(mapId)}`);
  const saved = response.data;
  const origin = saved.data?.origin;
  const cells = saved.data?.cells;
  if (saved.data?.format !== 'occupancy-grid-v1'
    || typeof saved.data.resolution !== 'number'
    || !Array.isArray(origin) || origin.length < 3 || !origin.every((value) => typeof value === 'number')
    || !Array.isArray(cells) || cells.length !== saved.width * saved.height
    || !cells.every((value) => typeof value === 'number')) {
    throw new Error('BE trả về dữ liệu map không hợp lệ.');
  }
  return {
    timestamp: saved.data.timestamp ?? new Date().toISOString(),
    width: saved.width,
    height: saved.height,
    resolution: saved.data.resolution,
    originX: origin[0],
    originY: origin[1],
    originYaw: origin[2],
    data: cells,
  };
}

export async function startNavigationMode(mapId: string, armLeaseId: string) {
  await axiosClient.post(`/maps/${mapId}/start-navigation`, null, { params: { armLeaseId } });
}

export async function stopNavigationMode() {
  await axiosClient.delete('/robot-runtimes/real/navigation-mode');
}

