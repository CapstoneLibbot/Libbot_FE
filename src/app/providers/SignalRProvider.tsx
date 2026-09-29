import { PropsWithChildren, useEffect } from 'react';
import { signalRClient } from '../../services/realtime/signalRClient';

export function SignalRProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    signalRClient.start();
    return () => {
      signalRClient.stop();
    };
  }, []);

  return <>{children}</>;
}
