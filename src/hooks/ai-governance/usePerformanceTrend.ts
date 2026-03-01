import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PerformanceDailyRow {
  date: string;
  provider: string;
  feature: string;
  avg_latency: number | null;
  error_rate: number | null;
  success_rate: number | null;
  total_calls: number | null;
}

export function usePerformanceTrend(days = 30) {
  return useQuery({
    queryKey: ['ai-governance', 'performance-trend', days],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-governance', {
        body: { action: 'get_performance_trend', params: { days } },
      });
      if (error) throw error;
      return (data?.data ?? []) as PerformanceDailyRow[];
    },
    staleTime: 120_000,
  });
}
