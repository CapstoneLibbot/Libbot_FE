import { useState } from 'react';
import { dispatchWorkflow, previewDispatch } from '../api/dispatchApi';
import { DispatchPreview, DispatchRequest } from '../types/dispatch.types';
import { useQueryClient } from '@tanstack/react-query';

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
      await queryClient.invalidateQueries({ queryKey: ['missions'] });
      return result;
    } finally {
      setSubmitting(false);
    }
  };

  return { preview, submitting, generatePreview, dispatch };
}
