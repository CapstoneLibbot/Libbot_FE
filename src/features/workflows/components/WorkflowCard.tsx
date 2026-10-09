import { Workflow } from '../types/workflow.types';
import { Link } from 'react-router-dom';

export function WorkflowCard({ workflow, onDelete }: { workflow: Workflow; onDelete?: (id: string) => void }) {
  return (
    <div className="builder-card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>{workflow.name}</h3>
          <div style={{ color: '#6b7280', fontSize: 12 }}>{workflow.type}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`status-badge ${workflow.isActive ? 'success' : 'info'}`}>
            {workflow.isActive ? 'Active' : 'Inactive'}
          </span>
          <Link to={`/workflows/builder/${workflow.id}`}>Edit</Link>
          {onDelete ? <button className="button ghost" onClick={() => onDelete(workflow.id)}>Delete</button> : null}
        </div>
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
