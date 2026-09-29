import { WorkflowStep } from '../../workflows/types/workflow.types';

export function MissionTimeline({ steps = [] }: { steps?: WorkflowStep[] }) {
  return (
    <div className="timeline">
      {steps.map((step) => (
        <div key={step.id} className="timeline-item done">
          {step.type}
        </div>
      ))}
    </div>
  );
}
