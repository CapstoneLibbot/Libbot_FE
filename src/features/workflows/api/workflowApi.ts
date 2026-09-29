import { axiosClient } from '../../../services/api/axiosClient';
import { Workflow, WorkflowCreateRequest } from '../types/workflow.types';
import { mockWorkflows } from '../../../mockData';

export async function getWorkflows(): Promise<Workflow[]> {
  try {
    const response = await axiosClient.get<Workflow[]>('/workflows');
    return response.data;
  } catch {
    return mockWorkflows;
  }
}

export async function getWorkflow(id: string): Promise<Workflow | null> {
  try {
    const response = await axiosClient.get<Workflow>(`/workflows/${id}`);
    return response.data;
  } catch {
    return mockWorkflows.find((workflow) => workflow.id === id) ?? null;
  }
}

export async function createWorkflow(payload: WorkflowCreateRequest): Promise<Workflow> {
  try {
    const response = await axiosClient.post<Workflow>('/workflows', payload);
    return response.data;
  } catch {
    const created: Workflow = {
      id: `workflow-${Date.now()}`,
      name: payload.name,
      description: payload.description,
      type: payload.type,
      isActive: true,
      steps: payload.steps
    };

    return created;
  }
}
