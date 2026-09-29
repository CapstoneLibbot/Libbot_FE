import { useQuery } from '@tanstack/react-query';
import { getMission } from '../api/missionApi';

export function useMission(id: string | undefined) {
  return useQuery({
    queryKey: ['mission', id],
    queryFn: () => getMission(id ?? ''),
    enabled: Boolean(id),
    retry: false
  });
}
