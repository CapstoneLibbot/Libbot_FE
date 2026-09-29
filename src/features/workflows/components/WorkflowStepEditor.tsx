import { WorkflowStep } from '../types/workflow.types';

export function WorkflowStepEditor({
  step,
  onChange,
  onRemove
}: {
  step: WorkflowStep;
  onChange: (patch: Partial<WorkflowStep>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="builder-card step-editor">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{step.sequence}. {step.type}</strong>
        <button className="button ghost" onClick={onRemove}>Remove</button>
      </div>

      <div className="form-row">
        <label className="field-label">Name</label>
        <input
          className="field-input"
          value={step.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </div>

      <div className="form-row">
        <label className="field-label">Target</label>
        <input
          className="field-input"
          value={(step.configuration?.target as string) ?? ''}
          onChange={(event) => onChange({ configuration: { ...step.configuration, target: event.target.value } })}
        />
      </div>
    </div>
  );
}
