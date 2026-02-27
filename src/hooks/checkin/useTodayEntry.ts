import { useQuery } from '@tanstack/react-query';
import { fetchTodayEntry } from '@/services/checkinService';

export function useTodayEntry(employeeId: string | null, date: string) {
  return useQuery({
    queryKey: ['mood-entry-today', employeeId, date],
    queryFn: () => fetchTodayEntry(employeeId!, date),
    enabled: !!employeeId,
  });
}
