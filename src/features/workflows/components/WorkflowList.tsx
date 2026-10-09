import { Loading } from '../../../components/common/Loading/Loading';
import { Workflow } from '../types/workflow.types';
import { WorkflowCard } from './WorkflowCard';

export function WorkflowList({ workflows, isLoading, onDelete }: { workflows?: Workflow[]; isLoading: boolean; onDelete?: (id: string) => void }) {
  const safeWorkflows = Array.isArray(workflows) ? workflows : [];

  if (isLoading) {
    return <Loading label="Loading workflows..." />;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {safeWorkflows.map((workflow) => (
        <WorkflowCard key={workflow.id} workflow={workflow} onDelete={onDelete} />
      ))}
    </div>
  );
}
