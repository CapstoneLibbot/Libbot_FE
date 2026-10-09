import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../../components/layout/PageContainer';
import { LibrarianLayout } from '../../../layouts/LibrarianLayout';
import { useMissions } from '../hooks/useMissions';
import { MissionStatus } from '../components/MissionStatus';
import { cancelMission } from '../api/missionApi';

export function MissionQueuePage() {
  const queryClient = useQueryClient();
  const { data: missions = [] } = useMissions();
  const cancel = useMutation({
    mutationFn: cancelMission,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['missions'] })
  });

  return (
    <LibrarianLayout>
      <PageContainer>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Mission Queue</span>
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gap: 12 }}>
              {missions.map((mission) => (
                <div key={mission.id} className="robot-card">
                  <div>
                    <strong>{mission.workflowName}</strong>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>Robot: {mission.robotName ?? 'Unassigned'}</div>
                  </div>
                  <MissionStatus status={mission.status} />
                  {mission.status !== 'COMPLETED' && mission.status !== 'CANCELLED' && mission.status !== 'FAILED' ? (
                    <button className="button ghost" onClick={() => cancel.mutate(mission.id)} disabled={cancel.isPending}>Cancel</button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </LibrarianLayout>
  );
}
