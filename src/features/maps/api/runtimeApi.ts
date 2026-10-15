import { axiosClient } from '../../../services/api/axiosClient';
import { Pose2D, RobotRuntime, SavedMap } from '../types/runtime';

export async function getRobotRuntimes(): Promise<RobotRuntime[]> {
  return (await axiosClient.get<RobotRuntime[]>('/robot-runtimes')).data;
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

export async function stopManual(runtimeId: string) {
  await axiosClient.post(`/robot-runtimes/${runtimeId}/manual-stop`);
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

export async function startNavigationMode(mapId: string, armLeaseId: string) {
  await axiosClient.post(`/maps/${mapId}/start-navigation`, null, { params: { armLeaseId } });
}

export async function stopNavigationMode() {
  await axiosClient.delete('/robot-runtimes/real/navigation-mode');
}

