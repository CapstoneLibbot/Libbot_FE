import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapCanvas } from '../../../components/map/MapCanvas';
import { MapBackground } from '../../../components/map/MapBackground';
import { MapLegend } from '../../../components/map/MapLegend';
import { MapWalls } from '../../../components/map/MapWalls';
import { PathLine } from '../../../components/map/PathLine';
import { RobotMarker } from '../../../components/map/RobotMarker';
import { ShelfMarker } from '../../../components/map/ShelfMarker';
import { StartMarker } from '../../../components/map/StartMarker';
import { GoalMarker } from '../../../components/map/GoalMarker';
import { WaypointMarker } from '../../../components/map/WaypointMarker';
import { Button } from '../../../components/common/Button/Button';
import { PageContainer } from '../../../components/layout/PageContainer';
import { LibrarianLayout } from '../../../layouts/LibrarianLayout';
import { getMaps, getRobots } from '../api/dispatchApi';
import { useDispatchPreview } from '../hooks/useDispatchPreview';
import { useDispatchWorkflow } from '../hooks/useDispatchWorkflow';
import { MissionTimeline } from '../../missions/components/MissionTimeline';
import { useWorkflows } from '../../workflows/hooks/useWorkflows';
import { exportRobotWorkflow } from '../../workflows/api/workflowApi';
import { cancelMission, getMissionExecution, submitMissionExecutionEvent } from '../../missions/api/missionApi';
import { MissionExecution } from '../../missions/types/mission.types';
import { signalRClient } from '../../../services/realtime/signalRClient';
import { useAuthStore } from '../../../app/store/authStore';

const SIMULATION_CONTEXT = JSON.stringify({
  query: 'technology',
  scan_queue: ['BOOK-123', 'BOOK-456'],
  patrol_observation_queue: [{ type: 'WARNING', description: 'Simulated shelf warning' }]
}, null, 2);
const REAL_CONTEXT = JSON.stringify({ query: 'technology' }, null, 2);

export function DispatchPreviewPage() {
  const canUseSimulation = useAuthStore((state) => state.user?.role === 'ADMIN');
  const queryClient = useQueryClient();
  const { data: workflows = [] } = useWorkflows();
  const { data: robots = [] } = useQuery({ queryKey: ['robots'], queryFn: getRobots });
  const { data: maps = [] } = useQuery({ queryKey: ['maps'], queryFn: getMaps });
  const { generatePreview, dispatch, submitting } = useDispatchWorkflow();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [selectedRobotId, setSelectedRobotId] = useState('');
  const [selectedMapId, setSelectedMapId] = useState('');
  const [runtimeId, setRuntimeId] = useState<'sim' | 'real'>(canUseSimulation ? 'sim' : 'real');
  const [initialContextText, setInitialContextText] = useState(canUseSimulation ? SIMULATION_CONTEXT : REAL_CONTEXT);
  const [previewPath, setPreviewPath] = useState<Array<{ x: number; y: number }>>([]);
  const [estimatedDistance, setEstimatedDistance] = useState(0);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [activeMissionId, setActiveMissionId] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [liveExecution, setLiveExecution] = useState<MissionExecution | null>(null);
  const [executionError, setExecutionError] = useState('');
  const [eventInput, setEventInput] = useState('');
  const [exportJson, setExportJson] = useState('');
  const [exportError, setExportError] = useState('');

  const selectedMap = useMemo(() => maps.find((map) => map.id === selectedMapId) ?? maps[0], [maps, selectedMapId]);
  const selectedWorkflow = useMemo(() => workflows.find((workflow) => workflow.id === selectedWorkflowId), [selectedWorkflowId, workflows]);
  const selectedRobot = useMemo(() => robots.find((robot) => robot.id === selectedRobotId), [robots, selectedRobotId]);
  const simulation = useDispatchPreview(previewPath);

  const { data: polledExecution } = useQuery({
    queryKey: ['mission-execution', activeMissionId],
    queryFn: () => getMissionExecution(activeMissionId),
    enabled: Boolean(activeMissionId),
    refetchInterval: (query) => {
      const status = String(query.state.data?.status ?? '').toUpperCase();
      return ['SUCCEEDED', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(status) ? false : 1500;
    }
  });
  const execution = liveExecution?.missionId === activeMissionId ? liveExecution : polledExecution;

  useEffect(() => {
    if (!selectedWorkflowId && workflows[0]) setSelectedWorkflowId(workflows[0].id);
  }, [selectedWorkflowId, workflows]);
  useEffect(() => {
    if (!selectedRobotId && robots[0]) setSelectedRobotId(robots[0].id);
  }, [selectedRobotId, robots]);
  useEffect(() => {
    if (!selectedMapId && maps[0]) setSelectedMapId(maps[0].id);
  }, [selectedMapId, maps]);
  useEffect(() => {
    if (!canUseSimulation && runtimeId === 'sim') setRuntimeId('real');
  }, [canUseSimulation, runtimeId]);

  useEffect(() => {
    void signalRClient.start();
    const unsubscribe = signalRClient.subscribe<MissionExecution>('MissionStepChanged', (payload) => {
      if (payload?.missionId === activeMissionId) setLiveExecution(payload);
    });
    return unsubscribe;
  }, [activeMissionId]);

  const handleGeneratePreview = async () => {
    if (!selectedWorkflowId) return;
    try {
      const preview = await generatePreview(selectedWorkflowId, selectedRobotId, selectedMapId);
      setPreviewPath(preview.path);
      setEstimatedDistance(preview.estimatedDistance);
      setEstimatedDuration(preview.estimatedDuration);
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Preview could not be generated.');
    }
  };

  const handleDispatch = async () => {
    if (!selectedWorkflowId) return;
    setExecutionError('');
    setLiveExecution(null);
    try {
      const context = JSON.parse(initialContextText || '{}') as Record<string, unknown>;
      if (!context || Array.isArray(context) || typeof context !== 'object') {
        throw new Error('Initial context must be a JSON object.');
      }
      const mission = await dispatch({
        workflowId: selectedWorkflowId,
        robotId: selectedRobotId || undefined,
        priority: 'HIGH',
        runtimeId,
        initialContext: context
      });
      setActiveMissionId(mission.id);
      await queryClient.invalidateQueries({ queryKey: ['missions'] });
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Mission could not be started.');
    }
  };

  const handleExport = async () => {
    if (!selectedWorkflowId) return;
    setExportError('');
    try {
      const document = await exportRobotWorkflow(selectedWorkflowId, runtimeId);
      setExportJson(JSON.stringify(document, null, 2));
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Workflow export failed.');
    }
  };

  const submitEvent = async (eventType: string, data: unknown) => {
    if (!activeMissionId) return;
    setExecutionError('');
    try {
      await submitMissionExecutionEvent(activeMissionId, eventType, data);
      setEventInput('');
      await queryClient.invalidateQueries({ queryKey: ['mission-execution', activeMissionId] });
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Workflow event was rejected.');
    }
  };

  const handleCancel = async () => {
    if (!activeMissionId) return;
    setCancelling(true);
    setExecutionError('');
    try {
      await cancelMission(activeMissionId);
      await queryClient.invalidateQueries({ queryKey: ['mission-execution', activeMissionId] });
      await queryClient.invalidateQueries({ queryKey: ['missions'] });
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Mission could not be cancelled.');
    } finally {
      setCancelling(false);
    }
  };

  const resultData = execution?.result?.data;
  const eventType = execution?.expectedEventType;
  const records = eventType === 'BOOK_SELECTED'
    ? resultData?.books ?? resultData?.results
    : eventType === 'FACILITY_SELECTED'
      ? resultData?.facilities ?? resultData?.results
      : null;
  const recordChoices: Array<{ id: string; label: string; data: unknown }> = Array.isArray(records)
    ? records.map((record: Record<string, unknown>) => ({
      id: String(record.bookId ?? record.facilityId ?? record.id ?? ''),
      label: String(record.title ?? record.name ?? record.id ?? 'Select'),
      data: eventType === 'BOOK_SELECTED'
        ? { bookId: record.bookId ?? record.id }
        : { facilityId: record.facilityId ?? record.id }
    })).filter((record) => Boolean(record.id))
    : [];
  const terminal = ['SUCCEEDED', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(String(execution?.status ?? '').toUpperCase());

  return (
    <LibrarianLayout>
      <PageContainer>
        <div className="page-grid">
          <div className="dashboard-grid" style={{ gridTemplateColumns: '280px minmax(0, 1fr) 300px' }}>
            <div className="panel">
              <div className="panel-header"><span className="panel-title">Workflow</span></div>
              <div className="panel-body">
                <h3>{selectedWorkflow?.name ?? 'Select a workflow'}</h3>
                <div className="status-badge info" style={{ marginBottom: 12 }}>{runtimeId.toUpperCase()}</div>
                {selectedWorkflow?.steps.map((step) => {
                  const active = execution?.currentStep === (step.configuration?.id ?? step.name);
                  return <div key={step.id} className="workflow-step" style={active ? { background: '#eef6ff', borderRadius: 6, fontWeight: 700 } : undefined}>
                    <span className="dot" />
                    <div>{step.sequence}. {step.type}{active ? ' · RUNNING' : ''}</div>
                  </div>;
                })}
              </div>
            </div>

            <div className="map-shell">
              <div className="map-toolbar">
                <div><strong>Library Map</strong></div>
                <div className="status-badge info">{runtimeId.toUpperCase()}</div>
              </div>
              <MapCanvas width={100} height={80}>
                <MapBackground />
                <MapWalls walls={selectedMap?.walls ?? []} />
                <ShelfMarker shelves={selectedMap?.shelves ?? []} />
                <WaypointMarker waypoints={selectedMap?.waypoints ?? []} />
                <PathLine path={previewPath} />
                <StartMarker x={selectedMap?.start.x ?? 10} y={selectedMap?.start.y ?? 10} />
                <GoalMarker x={selectedMap?.goal.x ?? 68} y={selectedMap?.goal.y ?? 50} />
                <RobotMarker x={simulation.currentPosition.x} y={simulation.currentPosition.y} angle={0} />
              </MapCanvas>
              <div style={{ padding: '0.75rem 1rem' }}><MapLegend /></div>
            </div>

            <div className="panel">
              <div className="panel-header"><span className="panel-title">Robot</span></div>
              <div className="panel-body">
                <h3>{selectedRobot?.name ?? 'Runtime robot'}</h3>
                <div className="status-badge info">{runtimeId === 'sim' ? 'Gazebo simulation' : 'Physical robot'}</div>
                <div style={{ marginTop: 16 }} className="metric-grid">
                  <div className="metric-card"><div className="metric-label">Battery</div><div className="metric-value">{selectedRobot?.battery ?? '--'}%</div></div>
                  <div className="metric-card"><div className="metric-label">Estimated Distance</div><div className="metric-value">{estimatedDistance.toFixed(1)} m</div></div>
                  <div className="metric-card"><div className="metric-label">Estimated Duration</div><div className="metric-value">{Math.floor(estimatedDuration / 60)}:{String(estimatedDuration % 60).padStart(2, '0')}</div></div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: 16 }}>
            <div className="controls-row" style={{ justifyContent: 'space-between' }}>
              <div className="controls-row">
                <select className="field-select" value={runtimeId} onChange={(event) => setRuntimeId(event.target.value as 'sim' | 'real')} aria-label="Robot runtime">
                  {canUseSimulation ? <option value="sim">Gazebo simulation (admin)</option> : null}
                  <option value="real">Physical robot</option>
                </select>
                <select className="field-select" value={selectedMapId} onChange={(event) => setSelectedMapId(event.target.value)}>
                  {maps.map((map) => <option key={map.id} value={map.id}>{map.name}</option>)}
                </select>
                <select className="field-select" value={selectedRobotId} onChange={(event) => setSelectedRobotId(event.target.value)}>
                  {robots.map((robot) => <option key={robot.id} value={robot.id}>{robot.name}</option>)}
                </select>
                <select className="field-select" value={selectedWorkflowId} onChange={(event) => setSelectedWorkflowId(event.target.value)}>
                  {workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}
                </select>
              </div>
              <div className="controls-row">
                <Button variant="ghost" onClick={simulation.reset}>Reset</Button>
                <Button variant="primary" onClick={handleGeneratePreview} disabled={!selectedWorkflow}>Generate Preview</Button>
                <Button variant="success" onClick={handleDispatch} disabled={!selectedWorkflow || submitting || (Boolean(activeMissionId) && !terminal)}>
                  {submitting ? 'Starting…' : `Start on ${runtimeId.toUpperCase()}`}
                </Button>
                <Button variant="ghost" onClick={handleExport} disabled={!selectedWorkflow}>Export Robot JSON</Button>
              </div>
            </div>

            <div className="form-row" style={{ marginTop: 14 }}>
              <label className="field-label">{runtimeId === 'sim' ? 'Initial context and simulation sensor inputs (JSON)' : 'Workflow input context (JSON)'}</label>
              <textarea className="field-input" rows={5} value={initialContextText} onChange={(event) => setInitialContextText(event.target.value)} />
            </div>
            {executionError ? <div role="alert" style={{ marginTop: 10, color: '#b91c1c' }}>{executionError}</div> : null}
            {exportError ? <div role="alert" style={{ marginTop: 10, color: '#b91c1c' }}>{exportError}</div> : null}
            {exportJson ? <div className="form-row" style={{ marginTop: 10 }}><label className="field-label">Robot workflow JSON</label><textarea className="field-input" rows={8} readOnly value={exportJson} /></div> : null}

            {activeMissionId ? (
              <div className="metric-card" style={{ marginTop: 14 }}>
                <div className="metric-label">Mission {activeMissionId}</div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                  <strong>Status: {execution?.status ?? 'CONNECTING'}</strong>
                  <strong>Current step: {execution?.currentStepName ?? execution?.currentStep ?? 'Waiting for robot'}</strong>
                  <strong>Step type: {execution?.currentStepType ?? '—'}</strong>
                  {execution?.expectedEventType ? <strong>Waiting for: {execution.expectedEventType}</strong> : null}
                  {!terminal ? <Button variant="ghost" onClick={handleCancel} disabled={cancelling}>{cancelling ? 'Stopping…' : 'Stop mission'}</Button> : null}
                </div>
                {execution?.error ? <div style={{ marginTop: 8, color: '#b91c1c' }}>{execution.error}</div> : null}
                {execution?.expectedEventType ? <div style={{ marginTop: 12 }}>
                  <div className="field-label">Submit workflow input</div>
                  <div className="controls-row" style={{ marginTop: 6 }}>
                    {recordChoices.map((choice) => <Button key={choice.id} variant="primary" onClick={() => void submitEvent(execution.expectedEventType!, choice.data)}>{choice.label}</Button>)}
                    {(execution.allowedValues ?? []).map((value) => <Button key={value} variant="primary" onClick={() => void submitEvent(execution.expectedEventType!, { value })}>{value}</Button>)}
                    <input className="field-input" style={{ maxWidth: 280 }} value={eventInput} onChange={(event) => setEventInput(event.target.value)} placeholder="Other event value" />
                    <Button variant="ghost" disabled={!eventInput} onClick={() => void submitEvent(execution.expectedEventType!, { value: eventInput })}>Submit</Button>
                  </div>
                </div> : null}
              </div>
            ) : null}

            <div style={{ marginTop: 16 }}><MissionTimeline steps={selectedWorkflow?.steps ?? []} /></div>
          </div>
        </div>
      </PageContainer>
    </LibrarianLayout>
  );
}
