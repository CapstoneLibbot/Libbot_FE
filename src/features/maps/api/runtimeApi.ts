import { axiosClient } from '../../../services/api/axiosClient';
import { Pose2D, RobotRuntime } from '../types/runtime';

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

