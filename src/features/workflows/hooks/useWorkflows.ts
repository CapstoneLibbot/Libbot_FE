import { useQuery } from '@tanstack/react-query';
import { getWorkflows } from '../api/workflowApi';

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: getWorkflows,
    select: (data) => (Array.isArray(data) ? data : [])
  });
}
