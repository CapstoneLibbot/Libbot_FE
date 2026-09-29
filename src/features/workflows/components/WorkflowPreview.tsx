import { Workflow } from '../types/workflow.types';

export function WorkflowPreview({ workflow }: { workflow: Workflow }) {
  return (
    <div className="builder-card">
      <div className="panel-header">
        <span className="panel-title">Workflow Preview</span>
      </div>
      <div className="panel-body">
        <h3>{workflow.name}</h3>
        <div style={{ color: '#6b7280' }}>{workflow.description}</div>
        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          {workflow.steps.map((step) => (
            <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="dot" />
              <span>{step.sequence}. {step.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
