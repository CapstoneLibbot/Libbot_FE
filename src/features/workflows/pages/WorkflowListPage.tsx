import { useWorkflows } from '../hooks/useWorkflows';
import { WorkflowList } from '../components/WorkflowList';
import { PageContainer } from '../../../components/layout/PageContainer';
import { LibrarianLayout } from '../../../layouts/LibrarianLayout';

export function WorkflowListPage() {
  const { data, isLoading } = useWorkflows();
  const workflows = Array.isArray(data) ? data : [];

  return (
    <LibrarianLayout>
      <PageContainer>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Workflows</span>
          </div>
          <div className="panel-body">
            <WorkflowList workflows={workflows} isLoading={isLoading} />
          </div>
        </div>
      </PageContainer>
    </LibrarianLayout>
  );
}
