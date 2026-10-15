import { PropsWithChildren, useEffect } from 'react';
import { signalRClient } from '../../services/realtime/signalRClient';

export function SignalRProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    void signalRClient.start();
    const reconnectTimer = window.setInterval(() => {
      void signalRClient.start();
    }, 5000);
    return () => {
      window.clearInterval(reconnectTimer);
      void signalRClient.stop();
    };
  }, []);

  return <>{children}</>;
}
