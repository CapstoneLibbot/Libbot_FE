import { useQuery } from '@tanstack/react-query';
import { getMissions } from '../api/missionApi';

export function useMissions() {
  return useQuery({
    queryKey: ['missions'],
    queryFn: getMissions
  });
}
