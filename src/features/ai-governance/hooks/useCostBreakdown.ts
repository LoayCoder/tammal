import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CostDailyRow {
  date: string;
  tenant_id: string;
  feature: string;
  provider: string;
  total_cost: number;
  total_calls: number;
  avg_cost_per_call: number;
}

export function useCostBreakdown(days = 30) {
  return useQuery({
    queryKey: ['ai-governance', 'cost-breakdown', days],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-governance', {
        body: { action: 'get_cost_breakdown', params: { days } },
      });
      if (error) throw error;
      return (data?.data ?? []) as CostDailyRow[];
    },
    staleTime: 120_000,
  });
}
