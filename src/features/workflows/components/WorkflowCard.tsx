import { Workflow } from '../types/workflow.types';

export function WorkflowCard({ workflow }: { workflow: Workflow }) {
  return (
    <div className="builder-card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>{workflow.name}</h3>
          <div style={{ color: '#6b7280', fontSize: 12 }}>{workflow.type}</div>
        </div>
        <span className={`status-badge ${workflow.isActive ? 'success' : 'info'}`}>
          {workflow.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
        {workflow.steps.map((step) => (
          <div key={step.id} style={{ fontSize: 12, color: '#374151' }}>
            {step.sequence}. {step.type}
          </div>
        ))}
      </div>
    </div>
  );
}
