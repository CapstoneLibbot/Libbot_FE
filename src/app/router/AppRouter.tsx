import { Route, Routes } from 'react-router-dom';
import { DispatchPreviewPage } from '../../features/dispatch/pages/DispatchPreviewPage';
import { MapDemoPage } from '../../features/maps/pages/MapDemoPage';
import { RobotMappingPage } from '../../features/maps/pages/RobotMappingPage';
import { MissionDetailPage } from '../../features/missions/pages/MissionDetailPage';
import { MissionQueuePage } from '../../features/missions/pages/MissionQueuePage';
import { WorkflowBuilderPage } from '../../features/workflows/pages/WorkflowBuilderPage';
import { WorkflowDetailPage } from '../../features/workflows/pages/WorkflowDetailPage';
import { WorkflowListPage } from '../../features/workflows/pages/WorkflowListPage';
import { routePaths } from './routePaths';

export function AppRouter() {
  return (
    <Routes>
      <Route path={routePaths.home} element={<WorkflowListPage />} />
      <Route path={routePaths.workflows} element={<WorkflowListPage />} />
      <Route path={routePaths.workflowDetail} element={<WorkflowDetailPage />} />
      <Route path={routePaths.workflowBuilder} element={<WorkflowBuilderPage />} />
      <Route path="/workflows/builder/:id" element={<WorkflowBuilderPage />} />
      <Route path={routePaths.missions} element={<MissionQueuePage />} />
      <Route path={routePaths.missionDetail} element={<MissionDetailPage />} />
      <Route path={routePaths.dispatch} element={<DispatchPreviewPage />} />
      <Route path={routePaths.dispatchPreview} element={<DispatchPreviewPage />} />
      <Route path={routePaths.mapDemo} element={<MapDemoPage />} />
      <Route path={routePaths.robotMapping} element={<RobotMappingPage />} />
      <Route path={routePaths.notFound} element={<div>Page not found</div>} />
    </Routes>
  );
}
