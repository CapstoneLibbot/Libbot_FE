import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/common/Button/Button';
import { deleteWorkflow } from '../api/workflowApi';
import { useWorkflows } from '../hooks/useWorkflows';
import { WorkflowList } from '../components/WorkflowList';
import { PageContainer } from '../../../components/layout/PageContainer';
import { LibrarianLayout } from '../../../layouts/LibrarianLayout';

export function WorkflowListPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useWorkflows();
  const removeWorkflow = useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] })
  });
  const workflows = Array.isArray(data) ? data : [];

  return (
    <LibrarianLayout>
      <PageContainer>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Workflows</span>
            <Link to="/workflows/builder"><Button variant="primary">Create Workflow</Button></Link>
          </div>
          <div className="panel-body">
            <WorkflowList workflows={workflows} isLoading={isLoading} onDelete={(id) => removeWorkflow.mutate(id)} />
          </div>
        </div>
      </PageContainer>
    </LibrarianLayout>
  );
}
