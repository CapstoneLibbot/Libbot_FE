import { useEffect, useMemo, useRef, useState } from 'react';
import { PathPoint } from '../../../types/map';

export function useDispatchPreview(path: PathPoint[] = []) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(3);
  const animationRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const pointCount = path.length;

  const currentPosition = useMemo(() => {
    if (!pointCount) {
      return { x: 0, y: 0 };
    }

    const clamped = Math.min(Math.max(progress, 0), 1);
    const scaledIndex = clamped * (pointCount - 1);
    const startIndex = Math.floor(scaledIndex);
    const endIndex = Math.min(startIndex + 1, pointCount - 1);
    const segmentProgress = scaledIndex - startIndex;
    const startPoint = path[startIndex];
    const endPoint = path[endIndex];

    return {
      x: startPoint.x + (endPoint.x - startPoint.x) * segmentProgress,
      y: startPoint.y + (endPoint.y - startPoint.y) * segmentProgress
    };
  }, [path, pointCount, progress]);

  useEffect(() => {
    if (!isPlaying || !pointCount) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const tick = (timestamp: number) => {
      if (lastTimestampRef.current == null) {
        lastTimestampRef.current = timestamp;
      }

      const delta = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      setProgress((current) => {
        const next = current + delta * 0.06 * speed;
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      lastTimestampRef.current = null;
    };
  }, [isPlaying, pointCount, speed]);

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const reset = () => {
    setProgress(0);
    setIsPlaying(false);
  };

  return {
    isPlaying,
    progress,
    speed,
    setSpeed,
    play,
    pause,
    reset,
    currentPosition
  };
}
