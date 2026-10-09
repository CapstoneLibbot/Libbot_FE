import { axiosClient } from '../../../services/api/axiosClient';
import { DispatchPreview, DispatchPreviewRequest, DispatchRequest } from '../types/dispatch.types';
import { MapDefinition } from '../../../types/map';

export async function getRobots(): Promise<{ id: string; name: string; status: 'AVAILABLE' | 'BUSY' | 'OFFLINE'; battery: number; location: string }[]> {
  const response = await axiosClient.get<Array<{ id: string; name: string; status: string; batteryLevel: number }>>('/Robot');
  return response.data.map((robot) => ({
    id: robot.id,
    name: robot.name,
    status: (robot.status.toLowerCase() === 'idle' ? 'AVAILABLE' : robot.status.toLowerCase() === 'busy' ? 'BUSY' : 'OFFLINE') as 'AVAILABLE' | 'BUSY' | 'OFFLINE',
    battery: robot.batteryLevel,
    location: ''
  }));
}

export async function getRobot(id: string) {
  const robots = await getRobots();
  return robots.find((robot) => robot.id === id) ?? null;
}

export async function getMaps(): Promise<MapDefinition[]> {
  const response = await axiosClient.get<Array<{ id: string; name: string; width: number; height: number; data?: Record<string, unknown> }>>('/maps');
  return response.data.map((map) => {
    const data = map.data ?? {};
    return {
      ...data,
      id: map.id,
      name: map.name,
      floor: typeof data.floor === 'number' ? data.floor : 1,
      width: map.width,
      height: map.height,
      walls: Array.isArray(data.walls) ? data.walls as MapDefinition['walls'] : [],
      shelves: Array.isArray(data.shelves) ? data.shelves as MapDefinition['shelves'] : [],
      waypoints: Array.isArray(data.waypoints) ? data.waypoints as MapDefinition['waypoints'] : [],
      start: data.start as MapDefinition['start'] ?? { x: 0, y: 0 },
      goal: data.goal as MapDefinition['goal'] ?? { x: map.width, y: map.height }
    };
  });
}

export async function previewDispatch(payload: DispatchPreviewRequest): Promise<DispatchPreview> {
  const response = await axiosClient.post<DispatchPreview>('/missions/preview', payload);
  return response.data;
}

export async function dispatchWorkflow(payload: DispatchRequest) {
  const response = await axiosClient.post('/missions', payload);
  return response.data;
}
