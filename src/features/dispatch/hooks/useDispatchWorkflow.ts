import { useState } from 'react';
import { dispatchWorkflow, previewDispatch } from '../api/dispatchApi';
import { DispatchPreview, DispatchRequest } from '../types/dispatch.types';
import { useQueryClient } from '@tanstack/react-query';
import { armRuntime, startMission } from '../../missions/api/missionApi';

export function useDispatchWorkflow() {
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<DispatchPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const generatePreview = async (workflowId: string, robotId?: string, mapId?: string) => {
    const nextPreview = await previewDispatch({ workflowId, robotId, mapId });
    setPreview(nextPreview);
    return nextPreview;
  };

  const dispatch = async (payload: DispatchRequest) => {
    setSubmitting(true);
    try {
      const result = await dispatchWorkflow(payload);
      const armLease = payload.runtimeId === 'real' ? await armRuntime('real') : undefined;
      await startMission(result.id, armLease?.armLeaseId);
      await queryClient.invalidateQueries({ queryKey: ['missions'] });
      await queryClient.invalidateQueries({ queryKey: ['mission-execution', result.id] });
      return result;
    } finally {
      setSubmitting(false);
    }
  };

  return { preview, submitting, generatePreview, dispatch };
}
