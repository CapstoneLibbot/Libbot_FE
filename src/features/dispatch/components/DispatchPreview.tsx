import { DispatchSummary } from './DispatchSummary';

export function DispatchPreview({ distance, duration }: { distance: number; duration: number }) {
  return <DispatchSummary distance={distance} duration={duration} />;
}
