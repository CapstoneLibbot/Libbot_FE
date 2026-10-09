import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapCanvas } from '../../../components/map/MapCanvas';
import { MapBackground } from '../../../components/map/MapBackground';
import { MapControls } from '../../../components/map/MapControls';
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
import { DispatchPanel } from '../components/DispatchPanel';
import { MissionTimeline } from '../../missions/components/MissionTimeline';
import { useWorkflows } from '../../workflows/hooks/useWorkflows';

export function DispatchPreviewPage() {
  const { data: workflows = [] } = useWorkflows();
  const { data: robots = [] } = useQuery({ queryKey: ['robots'], queryFn: getRobots });
  const { data: maps = [] } = useQuery({ queryKey: ['maps'], queryFn: getMaps });
  const { generatePreview, dispatch } = useDispatchWorkflow();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [selectedRobotId, setSelectedRobotId] = useState('');
  const [selectedMapId, setSelectedMapId] = useState('');
  const [mode, setMode] = useState<'SIMULATION' | 'LIVE'>('SIMULATION');
  const [previewPath, setPreviewPath] = useState<Array<{ x: number; y: number }>>([]);
  const [estimatedDistance, setEstimatedDistance] = useState(32.4);
  const [estimatedDuration, setEstimatedDuration] = useState(155);

  const selectedMap = useMemo(() => maps.find((map) => map.id === selectedMapId) ?? maps[0], [maps, selectedMapId]);
  const selectedWorkflow = useMemo(() => workflows.find((workflow) => workflow.id === selectedWorkflowId), [selectedWorkflowId, workflows]);
  const selectedRobot = useMemo(() => robots.find((robot) => robot.id === selectedRobotId), [robots, selectedRobotId]);

  const simulation = useDispatchPreview(previewPath);

  useEffect(() => {
    if (!selectedWorkflowId && workflows[0]) setSelectedWorkflowId(workflows[0].id);
  }, [workflows]);

  useEffect(() => {
    if (!selectedRobotId && robots[0]) setSelectedRobotId(robots[0].id);
  }, [robots]);

  useEffect(() => {
    if (!selectedMapId && maps[0]) setSelectedMapId(maps[0].id);
  }, [maps]);

  const handleGeneratePreview = async () => {
    const preview = await generatePreview(selectedWorkflowId, selectedRobotId, selectedMapId);
    setPreviewPath(preview.path);
    setEstimatedDistance(preview.estimatedDistance);
    setEstimatedDuration(preview.estimatedDuration);
    setMode('SIMULATION');
  };

  const handleDispatch = async () => {
    await dispatch({ workflowId: selectedWorkflowId, robotId: selectedRobotId || undefined, priority: 'HIGH' });
    setMode('LIVE');
  };

  return (
    <LibrarianLayout>
      <PageContainer>
        <div className="page-grid">
          <div className="dashboard-grid" style={{ gridTemplateColumns: '280px minmax(0, 1fr) 300px' }}>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Workflow</span>
              </div>
              <div className="panel-body">
                <h3>{selectedWorkflow?.name ?? 'Select a workflow'}</h3>
                <div className="status-badge info" style={{ marginBottom: 12 }}>{mode}</div>
                {selectedWorkflow?.steps.map((step) => (
                  <div key={step.id} className="workflow-step">
                    <span className="dot" />
                    <div>{step.sequence}. {step.type}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="map-shell">
              <div className="map-toolbar">
                <div><strong>Interactive Map</strong></div>
                <div className="status-badge info">{mode}</div>
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
              <div style={{ padding: '0.75rem 1rem' }}>
                <MapLegend />
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Robot</span>
              </div>
              <div className="panel-body">
                <h3>{selectedRobot?.name ?? 'No robot selected'}</h3>
                <div className="status-badge success">Available</div>
                <div style={{ marginTop: 16 }} className="metric-grid">
                  <div className="metric-card">
                    <div className="metric-label">Battery</div>
                    <div className="metric-value">{selectedRobot?.battery ?? '--'}%</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Estimated Distance</div>
                    <div className="metric-value">{estimatedDistance.toFixed(1)} m</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Estimated Duration</div>
                    <div className="metric-value">{Math.floor(estimatedDuration / 60)}:{String(estimatedDuration % 60).padStart(2, '0')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: 16 }}>
            <div className="controls-row" style={{ justifyContent: 'space-between' }}>
              <div className="controls-row">
                <select className="field-select" value={selectedMapId} onChange={(event) => setSelectedMapId(event.target.value)}>
                  {maps.map((map) => (
                    <option key={map.id} value={map.id}>{map.name}</option>
                  ))}
                </select>
                <select className="field-select" value={selectedRobotId} onChange={(event) => setSelectedRobotId(event.target.value)}>
                  {robots.map((robot) => (
                    <option key={robot.id} value={robot.id}>{robot.name}</option>
                  ))}
                </select>
                <select className="field-select" value={selectedWorkflowId} onChange={(event) => setSelectedWorkflowId(event.target.value)}>
                  {workflows.map((workflow) => (
                    <option key={workflow.id} value={workflow.id}>{workflow.name}</option>
                  ))}
                </select>
              </div>

              <div className="controls-row">
                <Button variant="ghost" onClick={simulation.reset}>Reset</Button>
                <Button variant="primary" onClick={simulation.play}>▶ Preview</Button>
                <Button variant="ghost" onClick={simulation.pause}>⏸ Pause</Button>
                <Button variant="success" onClick={handleDispatch} disabled={!selectedWorkflow}>Dispatch Mission</Button>
              </div>
            </div>

            <div className="controls-row" style={{ marginTop: 12 }}>
              {([0.5, 1, 2, 4]).map((value) => (
                <button key={value} className="button ghost" onClick={() => simulation.setSpeed(value)}>
                  {value}x
                </button>
              ))}
              <Button variant="primary" onClick={handleGeneratePreview} disabled={!selectedWorkflow}>Generate Preview</Button>
            </div>

            <div style={{ marginTop: 16 }}>
              <MissionTimeline steps={selectedWorkflow?.steps ?? []} />
            </div>
          </div>

          <div className="panel" style={{ padding: 16 }}>
            <DispatchPanel
              workflows={workflows}
              robots={robots}
              workflowId={selectedWorkflowId}
              robotId={selectedRobotId}
              onWorkflowChange={setSelectedWorkflowId}
              onRobotChange={setSelectedRobotId}
              onDispatch={handleDispatch}
            />
          </div>
        </div>
      </PageContainer>
    </LibrarianLayout>
  );
}
