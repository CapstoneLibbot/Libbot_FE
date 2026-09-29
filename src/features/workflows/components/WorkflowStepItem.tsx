import { WorkflowStep, WorkflowStepType } from '../types/workflow.types';

export function WorkflowStepItem({ step, isCurrent = false }: { step: WorkflowStep; isCurrent?: boolean }) {
  return (
    <li className={`workflow-step ${isCurrent ? 'active' : ''}`}>
      <span className="dot" />
      <div style={{ flex: 1 }}>
        <strong>{step.sequence}. {step.type}</strong>
        <div style={{ color: '#6b7280', fontSize: 12 }}>{step.name}</div>
      </div>
    </li>
  );
}
