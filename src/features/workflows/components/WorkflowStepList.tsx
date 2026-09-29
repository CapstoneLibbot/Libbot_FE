import { WorkflowStep } from '../types/workflow.types';
import { WorkflowStepItem } from './WorkflowStepItem';

export function WorkflowStepList({ steps }: { steps: WorkflowStep[] }) {
  return (
    <ul className="workflow-steps">
      {steps.map((step) => (
        <WorkflowStepItem key={step.id} step={step} isCurrent={step.sequence === 1} />
      ))}
    </ul>
  );
}
