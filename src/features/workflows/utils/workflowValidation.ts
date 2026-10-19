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

    if (step.type === WorkflowStepType.MOVE
      && !step.configuration?.target
      && !step.configuration?.endpoint_id
      && !step.configuration?.endpoint_name
      && !(step.configuration?.x !== undefined && step.configuration?.y !== undefined)) {
      errors.push('MOVE steps must include a target or an endpoint.');
    }

    if (step.type === WorkflowStepType.WAIT
      && !step.configuration?.duration_sec
      && !step.configuration?.duration_ms
      && !step.configuration?.wait_for) {
      errors.push('WAIT steps must include a duration or wait condition.');
    }

    if (step.type === WorkflowStepType.NOTIFY && !step.configuration?.target && !step.configuration?.message) {
      errors.push('NOTIFY steps must include a target or message.');
    }
  });

  const sequenceOrder = workflow.steps.map((step) => step.sequence).sort((a, b) => a - b);
  if (sequenceOrder.some((value, index) => value !== index + 1)) {
    errors.push('Workflow sequence must be valid.');
  }

  const ids = new Set(workflow.steps.map((step) => String(step.configuration?.id ?? step.id)));
  const transitionKeys = ['on_success', 'on_error', 'on_timeout', 'on_event', 'on_cancel', 'on_true', 'on_false', 'on_true_step', 'on_false_step', 'on_timeout_step', 'on_cancel_step'];
  workflow.steps.forEach((step, index) => {
    const transitions = step.configuration?.transitions;
    if (!transitions || typeof transitions !== 'object') return;
    Object.entries(transitions as Record<string, unknown>).forEach(([key, target]) => {
      if (transitionKeys.includes(key) && typeof target === 'string' && !ids.has(target)) {
        errors.push(`Step ${index + 1} transitions to unknown step '${target}'.`);
      }
    });
  });

  return { isValid: errors.length === 0, errors };
}
