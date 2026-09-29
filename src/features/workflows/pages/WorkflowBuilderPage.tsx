import { useWorkflowBuilder } from '../hooks/useWorkflowBuilder';
import { WorkflowStepEditor } from '../components/WorkflowStepEditor';
import { Button } from '../../../components/common/Button/Button';
import { PageContainer } from '../../../components/layout/PageContainer';
import { LibrarianLayout } from '../../../layouts/LibrarianLayout';
import { WorkflowStepType } from '../types/workflow.types';

export function WorkflowBuilderPage() {
  const { workflow, validation, updateWorkflow, addStep, removeStep, updateStep, reorderStep, saveWorkflow } = useWorkflowBuilder();

  const handleSave = async () => {
    const result = await saveWorkflow();
    if (result.ok) {
      alert('Workflow saved successfully');
    } else {
      alert(result.errors.join('\n'));
    }
  };

  return (
    <LibrarianLayout>
      <PageContainer>
        <div className="page-grid">
          <div className="builder-card">
            <div className="panel-header">
              <span className="panel-title">Workflow Builder</span>
            </div>
            <div className="panel-body" style={{ display: 'grid', gap: 16 }}>
              <div className="form-row">
                <label className="field-label">Workflow Name</label>
                <input className="field-input" value={workflow.name} onChange={(event) => updateWorkflow({ name: event.target.value })} />
              </div>
              <div className="form-row">
                <label className="field-label">Type</label>
                <input className="field-input" value={workflow.type} onChange={(event) => updateWorkflow({ type: event.target.value })} />
              </div>
              <div className="controls-row">
                <Button variant="primary" onClick={() => addStep(WorkflowStepType.MOVE)}>Add Step</Button>
                <Button variant="ghost" onClick={handleSave}>Save</Button>
              </div>
              {!validation.isValid && (
                <div style={{ color: '#b91c1c', fontSize: 12 }}>
                  {validation.errors.join(' • ')}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {workflow.steps.map((step, index) => (
              <div key={step.id}>
                <WorkflowStepEditor
                  step={step}
                  onChange={(patch) => updateStep(step.id, patch)}
                  onRemove={() => removeStep(step.id)}
                />
                <div className="step-actions">
                  <button className="button ghost" disabled={index === 0} onClick={() => reorderStep(index, index - 1)}>↑</button>
                  <button className="button ghost" disabled={index === workflow.steps.length - 1} onClick={() => reorderStep(index, index + 1)}>↓</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageContainer>
    </LibrarianLayout>
  );
}
