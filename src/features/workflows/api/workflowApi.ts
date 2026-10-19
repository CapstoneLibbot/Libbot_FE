import { axiosClient } from '../../../services/api/axiosClient';
import { Workflow, WorkflowCreateRequest, WorkflowTemplate } from '../types/workflow.types';

export async function getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  const response = await axiosClient.get<WorkflowTemplate[]>('/workflows/templates');
  return response.data;
}

export async function createWorkflowFromTemplate(templateId: string, name?: string): Promise<Workflow> {
  const response = await axiosClient.post<Workflow>(`/workflows/templates/${templateId}/create`, { name });
  return response.data;
}

export async function exportRobotWorkflow(id: string, runtimeId: 'sim' | 'real') {
  const response = await axiosClient.get(`/workflows/${id}/robot-json`, { params: { runtimeId } });
  return response.data;
}

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
