import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '../../../components/common/Button/Button';
import { createWorkflowFromTemplate, deleteWorkflow, getWorkflowTemplates } from '../api/workflowApi';
import { useWorkflows } from '../hooks/useWorkflows';
import { WorkflowList } from '../components/WorkflowList';
import { PageContainer } from '../../../components/layout/PageContainer';
import { LibrarianLayout } from '../../../layouts/LibrarianLayout';

export function WorkflowListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useWorkflows();
  const { data: templates = [] } = useQuery({ queryKey: ['workflow-templates'], queryFn: getWorkflowTemplates });
  const [templateId, setTemplateId] = useState('');
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState('');
  const removeWorkflow = useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] })
  });
  const workflows = Array.isArray(data) ? data : [];

  const handleCreateFromTemplate = async () => {
    if (!templateId) return;
    setCreatingTemplate(true);
    setTemplateError('');
    try {
      const created = await createWorkflowFromTemplate(templateId);
      await queryClient.invalidateQueries({ queryKey: ['workflows'] });
      navigate(`/workflows/builder/${created.id}`);
    } catch (error) {
      setTemplateError(error instanceof Error ? error.message : 'Could not create workflow from template.');
    } finally {
      setCreatingTemplate(false);
    }
  };

  return (
    <LibrarianLayout>
      <PageContainer>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Workflows</span>
            <div className="controls-row">
              <select className="field-select" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
                <option value="">Choose a workflow template</option>
                {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
              </select>
              <Button variant="success" onClick={handleCreateFromTemplate} disabled={!templateId || creatingTemplate}>
                {creatingTemplate ? 'Creating…' : 'Use Template'}
              </Button>
              <Link to="/workflows/builder"><Button variant="primary">Create Workflow</Button></Link>
            </div>
          </div>
          {templateError ? <div style={{ padding: '0 16px 12px', color: '#b91c1c' }}>{templateError}</div> : null}
          <div className="panel-body">
            <WorkflowList workflows={workflows} isLoading={isLoading} onDelete={(id) => removeWorkflow.mutate(id)} />
          </div>
        </div>
      </PageContainer>
    </LibrarianLayout>
  );
}
