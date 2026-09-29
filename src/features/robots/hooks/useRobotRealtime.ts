import { useEffect, useState } from 'react';
import { signalRClient } from '../../../services/realtime/signalRClient';

export function useRobotRealtime(robotId?: string) {
  const [robotState, setRobotState] = useState({
    x: 0,
    y: 0,
    yaw: 0,
    battery: 100,
    status: 'AVAILABLE'
  });

  useEffect(() => {
    const unsubscribePosition = signalRClient.subscribe<{ robotId?: string; x?: number; y?: number; yaw?: number }>('RobotPositionUpdated', (payload) => {
      if (payload?.robotId && robotId && payload.robotId !== robotId) {
        return;
      }

      setRobotState((current) => ({
        ...current,
        x: payload?.x ?? current.x,
        y: payload?.y ?? current.y,
        yaw: payload?.yaw ?? current.yaw
      }));
    });

    const unsubscribeBattery = signalRClient.subscribe<{ robotId?: string; battery?: number }>('RobotBatteryUpdated', (payload) => {
      if (payload?.robotId && robotId && payload.robotId !== robotId) {
        return;
      }

      setRobotState((current) => ({
        ...current,
        battery: payload?.battery ?? current.battery
      }));
    });

    const unsubscribeStatus = signalRClient.subscribe<{ robotId?: string; status?: string }>('RobotStatusChanged', (payload) => {
      if (payload?.robotId && robotId && payload.robotId !== robotId) {
        return;
      }

      setRobotState((current) => ({
        ...current,
        status: payload?.status ?? current.status
      }));
    });

    return () => {
      unsubscribePosition();
      unsubscribeBattery();
      unsubscribeStatus();
    };
  }, [robotId]);

  return robotState;
}
