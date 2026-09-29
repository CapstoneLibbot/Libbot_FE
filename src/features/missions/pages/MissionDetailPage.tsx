import { useParams } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { LibrarianLayout } from '../../../layouts/LibrarianLayout';
import { useMission } from '../hooks/useMission';
import { MissionStatus } from '../components/MissionStatus';

export function MissionDetailPage() {
  const { id } = useParams();
  const { data: mission } = useMission(id);

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
          </div>
        </div>
      </PageContainer>
    </LibrarianLayout>
  );
}
