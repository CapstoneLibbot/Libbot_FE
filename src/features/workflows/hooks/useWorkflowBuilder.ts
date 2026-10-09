import { useEffect, useMemo, useState } from 'react';
import { createWorkflow, updateWorkflow as updateWorkflowApi } from '../api/workflowApi';
import { Workflow, WorkflowStep, WorkflowStepType } from '../types/workflow.types';
import { validateWorkflow } from '../utils/workflowValidation';

const defaultWorkflow = (): Workflow => ({
  id: '',
  name: 'Library Patrol',
  description: 'Autonomous library patrol workflow.',
  type: 'PATROL',
  isActive: true,
  steps: [
    { id: 'step-1', sequence: 1, type: WorkflowStepType.MOVE, name: 'MOVE', configuration: { target: 'Shelf A' } },
    { id: 'step-2', sequence: 2, type: WorkflowStepType.SCAN, name: 'SCAN', configuration: { mode: 'QR' } },
    { id: 'step-3', sequence: 3, type: WorkflowStepType.PROCESS_DATA, name: 'PROCESS_DATA' }
  ]
});

export function useWorkflowBuilder(initialWorkflow?: Workflow) {
  const [workflow, setWorkflow] = useState<Workflow>(initialWorkflow ?? defaultWorkflow());

  useEffect(() => {
    if (initialWorkflow) setWorkflow(initialWorkflow);
  }, [initialWorkflow]);

  const validation = useMemo(() => validateWorkflow(workflow), [workflow]);

  const updateWorkflow = (changes: Partial<Workflow>) => {
    setWorkflow((current) => ({ ...current, ...changes }));
  };

  const addStep = (type: WorkflowStepType = WorkflowStepType.MOVE) => {
    setWorkflow((current) => {
      const nextSequence = current.steps.length + 1;
      const step: WorkflowStep = {
        id: `step-${Date.now()}`,
        sequence: nextSequence,
        type,
        name: type,
        configuration: type === WorkflowStepType.MOVE ? { target: 'Shelf A' } : type === WorkflowStepType.WAIT ? { duration: 5 } : undefined
      };

      return {
        ...current,
        steps: [...current.steps, step]
      };
    });
  };

  const removeStep = (stepId: string) => {
    setWorkflow((current) => ({
      ...current,
      steps: current.steps.filter((step) => step.id !== stepId).map((step, index) => ({ ...step, sequence: index + 1 }))
    }));
  };

  const updateStep = (stepId: string, patch: Partial<WorkflowStep>) => {
    setWorkflow((current) => ({
      ...current,
      steps: current.steps.map((step) => (step.id === stepId ? { ...step, ...patch } : step))
    }));
  };

  const reorderStep = (fromIndex: number, toIndex: number) => {
    setWorkflow((current) => {
      const nextSteps = [...current.steps];
      const [item] = nextSteps.splice(fromIndex, 1);
      nextSteps.splice(toIndex, 0, item);
      return {
        ...current,
        steps: nextSteps.map((step, index) => ({ ...step, sequence: index + 1 }))
      };
    });
  };

  const saveWorkflow = async () => {
    const result = validateWorkflow(workflow);
    if (!result.isValid) {
      return { ok: false, errors: result.errors };
    }

    const payload = {
      name: workflow.name,
      description: workflow.description,
      type: workflow.type,
      steps: workflow.steps
    };
    const saved = workflow.id ? await updateWorkflowApi(workflow.id, payload) : await createWorkflow(payload);

    return { ok: true, workflow: saved, errors: [] as string[] };
  };

  return {
    workflow,
    validation,
    updateWorkflow,
    addStep,
    removeStep,
    updateStep,
    reorderStep,
    saveWorkflow
  };
}
