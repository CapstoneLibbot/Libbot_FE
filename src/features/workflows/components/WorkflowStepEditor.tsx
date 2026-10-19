import { useEffect, useState } from 'react';
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
  const [configurationText, setConfigurationText] = useState(JSON.stringify(step.configuration ?? {}, null, 2));
  const [configurationError, setConfigurationError] = useState('');

  useEffect(() => {
    setConfigurationText(JSON.stringify(step.configuration ?? {}, null, 2));
  }, [step.configuration]);

  const applyConfiguration = () => {
    try {
      const configuration = JSON.parse(configurationText);
      if (!configuration || Array.isArray(configuration) || typeof configuration !== 'object') {
        throw new Error('Configuration must be a JSON object.');
      }
      onChange({ configuration });
      setConfigurationError('');
    } catch (error) {
      setConfigurationError(error instanceof Error ? error.message : 'Invalid JSON configuration.');
    }
  };

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
        <label className="field-label">Step type</label>
        <select className="field-select" value={step.type} onChange={(event) => onChange({ type: event.target.value as WorkflowStep['type'] })}>
          {['MOVE', 'SCAN', 'PROCESS_DATA', 'EVALUATE', 'DISPLAY', 'WAIT', 'NOTIFY', 'END'].map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      <div className="form-row">
        <label className="field-label">Target</label>
        <input
          className="field-input"
          value={(step.configuration?.target as string) ?? ''}
          onChange={(event) => onChange({ configuration: { ...step.configuration, target: event.target.value } })}
        />
      </div>

      <div className="form-row">
        <label className="field-label">Step configuration (JSON)</label>
        <textarea className="field-input" rows={8} value={configurationText}
          onChange={(event) => setConfigurationText(event.target.value)} onBlur={applyConfiguration} />
        {configurationError ? <div style={{ color: '#b91c1c', fontSize: 12 }}>{configurationError}</div> : null}
      </div>
    </div>
  );
}
