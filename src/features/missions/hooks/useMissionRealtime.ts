import { useEffect, useState } from 'react';
import { signalRClient } from '../../../services/realtime/signalRClient';

export function useMissionRealtime() {
  const [status, setStatus] = useState<string>('IDLE');
  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    const unsubscribeStatus = signalRClient.subscribe<{ missionId?: string; status?: string }>('MissionStatusChanged', (payload) => {
      if (payload?.status) {
        setStatus(payload.status);
      }
    });

    const unsubscribeStep = signalRClient.subscribe<{ missionId?: string; currentStep?: number }>('MissionStepChanged', (payload) => {
      if (payload?.currentStep) {
        setCurrentStep(payload.currentStep);
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeStep();
    };
  }, []);

  return { status, currentStep };
}
