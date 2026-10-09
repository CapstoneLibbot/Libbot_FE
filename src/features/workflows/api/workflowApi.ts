import { axiosClient } from '../../../services/api/axiosClient';
import { Workflow, WorkflowCreateRequest } from '../types/workflow.types';

export async function getWorkflows(): Promise<Workflow[]> {
  const response = await axiosClient.get<Workflow[]>('/workflows');
  return response.data;
}

export async function getWorkflow(id: string): Promise<Workflow | null> {
  const response = await axiosClient.get<Workflow>(`/workflows/${id}`);
  return response.data;
}

export async function createWorkflow(payload: WorkflowCreateRequest): Promise<Workflow> {
  const response = await axiosClient.post<Workflow>('/workflows', payload);
  return response.data;
}

export async function updateWorkflow(id: string, payload: WorkflowCreateRequest): Promise<Workflow> {
  const response = await axiosClient.put<Workflow>(`/workflows/${id}`, { ...payload, isActive: true });
  return response.data;
}

export async function deleteWorkflow(id: string): Promise<void> {
  await axiosClient.delete(`/workflows/${id}`);
}
