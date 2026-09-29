import { useParams } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { LibrarianLayout } from '../../../layouts/LibrarianLayout';
import { useWorkflow } from '../hooks/useWorkflow';
import { WorkflowPreview } from '../components/WorkflowPreview';

export function WorkflowDetailPage() {
  const { id } = useParams();
  const { data: workflow } = useWorkflow(id);

  if (!workflow) {
    return null;
  }

  return (
    <LibrarianLayout>
      <PageContainer>
        <WorkflowPreview workflow={workflow} />
      </PageContainer>
    </LibrarianLayout>
  );
}
