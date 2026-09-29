import { PropsWithChildren } from 'react';
import { QueryProvider } from './QueryProvider';
import { SignalRProvider } from './SignalRProvider';

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <SignalRProvider>{children}</SignalRProvider>
    </QueryProvider>
  );
}
