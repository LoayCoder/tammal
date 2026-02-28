import { useQuery } from '@tanstack/react-query';
import {
  fetchGamificationData,
  calculatePoints,
} from '@/services/gamificationService';

export function useGamification(employeeId: string | null) {
  const query = useQuery({
    queryKey: ['gamification', employeeId],
    queryFn: () => fetchGamificationData(employeeId!),
    enabled: !!employeeId,
  });

  return {
    streak: query.data?.streak ?? 0,
    totalPoints: query.data?.totalPoints ?? 0,
    isPending: query.isPending,
    calculatePoints,
  };
}
