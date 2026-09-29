import { useState } from 'react';
import { dispatchWorkflow, previewDispatch } from '../api/dispatchApi';
import { DispatchPreview, DispatchRequest } from '../types/dispatch.types';

export function useDispatchWorkflow() {
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
      return result;
    } finally {
      setSubmitting(false);
    }
  };

  return { preview, submitting, generatePreview, dispatch };
}
