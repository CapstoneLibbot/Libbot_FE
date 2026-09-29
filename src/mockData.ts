import { Workflow, WorkflowStepType } from './features/workflows/types/workflow.types';
import { Mission } from './features/missions/types/mission.types';
import { MapDefinition } from './types/map';

export const mockWorkflows: Workflow[] = [
  {
    id: 'workflow-001',
    name: 'Library Patrol',
    description: 'Autonomous route to patrol and scan shelves.',
    type: 'PATROL',
    isActive: true,
    steps: [
      { id: 'step-1', sequence: 1, type: WorkflowStepType.MOVE, name: 'Move', configuration: { target: 'Shelf A' } },
      { id: 'step-2', sequence: 2, type: WorkflowStepType.SCAN, name: 'Scan', configuration: { mode: 'QR' } },
      { id: 'step-3', sequence: 3, type: WorkflowStepType.PROCESS_DATA, name: 'Process Data' },
      { id: 'step-4', sequence: 4, type: WorkflowStepType.EVALUATE, name: 'Evaluate' },
      { id: 'step-5', sequence: 5, type: WorkflowStepType.NOTIFY, name: 'Notify', configuration: { target: 'Librarian', message: 'Inventory check complete' } }
    ]
  },
  {
    id: 'workflow-002',
    name: 'Shelf Refill',
    description: 'Move to shelves and notify staff on low inventory.',
    type: 'REFILL',
    isActive: true,
    steps: [
      { id: 'step-6', sequence: 1, type: WorkflowStepType.MOVE, name: 'Move', configuration: { target: 'Shelf B' } },
      { id: 'step-7', sequence: 2, type: WorkflowStepType.SCAN, name: 'Scan', configuration: { mode: 'QR' } },
      { id: 'step-8', sequence: 3, type: WorkflowStepType.PROCESS_DATA, name: 'Process Data' },
      { id: 'step-9', sequence: 4, type: WorkflowStepType.NOTIFY, name: 'Notify', configuration: { target: 'Staff' } }
    ]
  }
];

export const mockMissions: Mission[] = [
  {
    id: 'mission-001',
    workflowId: 'workflow-001',
    workflowName: 'Library Patrol',
    robotId: 'robot-001',
    robotName: 'LiBot-01',
    status: 'RUNNING',
    priority: 'HIGH',
    currentStep: 2,
    createdAt: '2026-09-29T08:00:00.000Z',
    startedAt: '2026-09-29T08:02:00.000Z'
  },
  {
    id: 'mission-002',
    workflowId: 'workflow-002',
    workflowName: 'Shelf Refill',
    robotId: 'robot-002',
    robotName: 'LiBot-02',
    status: 'QUEUED',
    priority: 'MEDIUM',
    currentStep: 1,
    createdAt: '2026-09-29T08:10:00.000Z'
  }
];

export const mockRobots: Array<{
  id: string;
  name: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  battery: number;
  location: string;
}> = [
  { id: 'robot-001', name: 'LiBot-01', status: 'AVAILABLE', battery: 87, location: 'Shelf A' },
  { id: 'robot-002', name: 'LiBot-02', status: 'BUSY', battery: 64, location: 'Checkout Desk' },
  { id: 'robot-003', name: 'LiBot-03', status: 'OFFLINE', battery: 21, location: 'Charging Station' }
];

export const mockMaps: MapDefinition[] = [
  {
    id: 'map-floor-1',
    name: 'Floor 1',
    floor: 1,
    width: 100,
    height: 80,
    walls: [
      { x1: 12, y1: 12, x2: 12, y2: 66 },
      { x1: 12, y1: 12, x2: 78, y2: 12 },
      { x1: 78, y1: 12, x2: 78, y2: 52 },
      { x1: 24, y1: 28, x2: 56, y2: 28 },
      { x1: 40, y1: 28, x2: 40, y2: 52 }
    ],
    shelves: [
      { id: 'shelf-a', type: 'SHELF', x: 18, y: 18, width: 12, height: 8 },
      { id: 'shelf-b', type: 'SHELF', x: 48, y: 18, width: 12, height: 8 },
      { id: 'shelf-c', type: 'SHELF', x: 18, y: 40, width: 12, height: 8 }
    ],
    waypoints: [
      { id: 'wp-1', type: 'WAYPOINT', x: 24, y: 46 },
      { id: 'wp-2', type: 'WAYPOINT', x: 60, y: 46 }
    ],
    chargingStation: { x: 69, y: 64 },
    start: { x: 10, y: 10 },
    goal: { x: 68, y: 50 }
  }
];

export const previewPath = [
  { x: 1, y: 1 },
  { x: 2, y: 1 },
  { x: 3, y: 1 },
  { x: 3, y: 2 },
  { x: 4, y: 2 },
  { x: 5, y: 3 },
  { x: 6, y: 3 }
];
