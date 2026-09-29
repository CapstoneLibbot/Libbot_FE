import { Workflow, WorkflowStepType } from '../types/workflow.types';

export function validateWorkflow(workflow: Workflow): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!workflow || !workflow.steps || workflow.steps.length === 0) {
    errors.push('Workflow must contain at least one step.');
    return { isValid: false, errors };
  }

  if (!workflow.name.trim()) {
    errors.push('Workflow name is required.');
  }

  workflow.steps.forEach((step, index) => {
    if (!step.type) {
      errors.push(`Step ${index + 1} is missing a type.`);
    }

    if (step.type === WorkflowStepType.MOVE && !step.configuration?.target) {
      errors.push('MOVE steps must include a target.');
    }

    if (step.type === WorkflowStepType.WAIT && !step.configuration?.duration) {
      errors.push('WAIT steps must include a duration.');
    }

    if (step.type === WorkflowStepType.NOTIFY && !step.configuration?.target && !step.configuration?.message) {
      errors.push('NOTIFY steps must include a target or message.');
    }
  });

  const sequenceOrder = workflow.steps.map((step) => step.sequence).sort((a, b) => a - b);
  if (sequenceOrder.some((value, index) => value !== index + 1)) {
    errors.push('Workflow sequence must be valid.');
  }

  return { isValid: errors.length === 0, errors };
}
