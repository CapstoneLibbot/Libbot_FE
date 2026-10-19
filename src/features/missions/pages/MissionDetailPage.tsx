import { useParams } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { LibrarianLayout } from '../../../layouts/LibrarianLayout';
import { useMission } from '../hooks/useMission';
import { MissionStatus } from '../components/MissionStatus';
import { useQuery } from '@tanstack/react-query';
import { getMissionExecution } from '../api/missionApi';

export function MissionDetailPage() {
  const { id } = useParams();
  const { data: mission } = useMission(id);
  const { data: execution } = useQuery({
    queryKey: ['mission-execution', id],
    queryFn: () => getMissionExecution(id ?? ''),
    enabled: Boolean(id),
    refetchInterval: (query) => ['SUCCEEDED', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(String(query.state.data?.status ?? '').toUpperCase()) ? false : 1500
  });

  if (!mission) {
    return null;
  }

  return (
    <LibrarianLayout>
      <PageContainer>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Mission</span>
            <MissionStatus status={mission.status} />
          </div>
          <div className="panel-body">
            <h2>{mission.workflowName}</h2>
            <div style={{ color: '#6b7280' }}>Robot: {mission.robotName ?? 'Unassigned'}</div>
            <div style={{ marginTop: 12 }} className="metric-grid">
              <div className="metric-card">
                <div className="metric-label">Priority</div>
                <div className="metric-value">{mission.priority}</div>
              </div>
            </div>
            <div className="metric-card" style={{ marginTop: 12 }}>
              <div className="metric-label">Workflow execution</div>
              <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                <div>Status: {execution?.status ?? mission.status}</div>
                <div>Runtime: {execution?.runtimeId ?? mission.runtimeId ?? 'real'}</div>
                <div>Current step: {execution?.currentStepName ?? execution?.currentStep ?? '—'}</div>
                <strong>Step type: {execution?.currentStepType ?? '—'}</strong>
                {execution?.expectedEventType ? <div>Waiting for: {execution.expectedEventType}</div> : null}
                {execution?.error ? <div style={{ color: '#b91c1c' }}>{execution.error}</div> : null}
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </LibrarianLayout>
  );
}
