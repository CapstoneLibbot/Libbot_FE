import { useQuery } from '@tanstack/react-query';
import { getWorkflow } from '../api/workflowApi';

export function useWorkflow(id: string | undefined) {
  return useQuery({
    queryKey: ['workflow', id],
    queryFn: () => getWorkflow(id ?? ''),
    enabled: Boolean(id),
    retry: false
  });
}
