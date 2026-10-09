import { RouteObject } from 'react-router-dom';
import { DispatchPreviewPage } from '../../features/dispatch/pages/DispatchPreviewPage';
import { MissionDetailPage } from '../../features/missions/pages/MissionDetailPage';
import { MissionQueuePage } from '../../features/missions/pages/MissionQueuePage';
import { WorkflowBuilderPage } from '../../features/workflows/pages/WorkflowBuilderPage';
import { WorkflowDetailPage } from '../../features/workflows/pages/WorkflowDetailPage';
import { WorkflowListPage } from '../../features/workflows/pages/WorkflowListPage';
import { routePaths } from './routePaths';

export const appRoutes: RouteObject[] = [
  { path: routePaths.home, element: <WorkflowListPage /> },
  { path: routePaths.workflows, element: <WorkflowListPage /> },
  { path: routePaths.workflowDetail, element: <WorkflowDetailPage /> },
  { path: routePaths.workflowBuilder, element: <WorkflowBuilderPage /> },
  { path: '/workflows/builder/:id', element: <WorkflowBuilderPage /> },
  { path: routePaths.missions, element: <MissionQueuePage /> },
  { path: routePaths.missionDetail, element: <MissionDetailPage /> },
  { path: routePaths.dispatch, element: <DispatchPreviewPage /> },
  { path: routePaths.dispatchPreview, element: <DispatchPreviewPage /> },
  { path: routePaths.notFound, element: <div>Page not found</div> }
];
