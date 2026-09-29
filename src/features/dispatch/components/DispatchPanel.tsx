import { Button } from '../../../components/common/Button/Button';
import { Workflow } from '../../workflows/types/workflow.types';
import { DispatchRequest } from '../types/dispatch.types';
import { RobotSelector } from './RobotSelector';
import { WorkflowSelector } from './WorkflowSelector';

export function DispatchPanel({
  workflows,
  robots,
  workflowId,
  robotId,
  onWorkflowChange,
  onRobotChange,
  onDispatch,
  priority = 'HIGH'
}: {
  workflows: Workflow[];
  robots: Array<{ id: string; name: string; status: string; battery: number }>;
  workflowId: string;
  robotId: string;
  onWorkflowChange: (workflowId: string) => void;
  onRobotChange: (robotId: string) => void;
  onDispatch: (payload: DispatchRequest) => void;
  priority?: DispatchRequest['priority'];
}) {
  return (
    <div className="builder-card" style={{ padding: 16 }}>
      <div className="panel-header">
        <span className="panel-title">Dispatch</span>
      </div>
      <div className="panel-body" style={{ display: 'grid', gap: 12 }}>
        <WorkflowSelector workflows={workflows} value={workflowId} onChange={onWorkflowChange} />
        <RobotSelector robots={robots} value={robotId} onChange={onRobotChange} />
        <div className="form-row">
          <label className="field-label">Priority</label>
          <select className="field-select" defaultValue={priority}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
        <Button variant="primary" onClick={() => onDispatch({ workflowId, robotId, priority })}>Dispatch Mission</Button>
      </div>
    </div>
  );
}
