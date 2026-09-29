export interface MapPose {
  x: number;
  y: number;
  yaw: number;
}

export interface PathPoint {
  x: number;
  y: number;
  timestamp?: number;
}

export interface RobotPose extends MapPose {
  robotId: string;
  status: string;
  battery: number;
}

export interface MapObject {
  id: string;
  type: 'SHELF' | 'WALL' | 'WAYPOINT' | 'CHARGING_STATION';
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface MapDefinition {
  id: string;
  name: string;
  floor: number;
  width: number;
  height: number;
  walls: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  shelves: MapObject[];
  waypoints: MapObject[];
  chargingStation?: { x: number; y: number };
  start: { x: number; y: number };
  goal: { x: number; y: number };
}
