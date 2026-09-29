import { Workflow } from '../../workflows/types/workflow.types';

export function WorkflowSelector({ workflows, value, onChange }: { workflows: Workflow[]; value: string; onChange: (workflowId: string) => void }) {
  return (
    <div className="form-row">
      <label className="field-label">Workflow</label>
      <select className="field-select" value={value} onChange={(event) => onChange(event.target.value)}>
        {workflows.map((workflow) => (
          <option key={workflow.id} value={workflow.id}>{workflow.name}</option>
        ))}
      </select>
    </div>
  );
}
