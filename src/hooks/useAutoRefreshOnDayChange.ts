import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getLocalDateString } from '@/utils/getLocalDate';

/**
 * Polls every 30s and invalidates prayer/sunnah queries when the date changes (midnight reset).
 */
export function useAutoRefreshOnDayChange() {
  const queryClient = useQueryClient();
  const lastDateRef = useRef(getLocalDateString());

  useEffect(() => {
    const interval = setInterval(() => {
      const currentDate = getLocalDateString();
      if (lastDateRef.current !== currentDate) {
        lastDateRef.current = currentDate;
        queryClient.invalidateQueries({ queryKey: ['prayer-logs'] });
        queryClient.invalidateQueries({ queryKey: ['sunnah-logs'] });
        queryClient.invalidateQueries({ queryKey: ['sunnah-history-logs'] });
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [queryClient]);
}
