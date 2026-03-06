import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface BurnoutPrediction {
  id: string;
  employee_id: string;
  burnout_probability_score: number;
  confidence_score: number;
  ai_reasoning: string | null;
  indicators: Record<string, number>;
  predicted_at: string;
}

export function useBurnoutPredictions() {
  const { tenantId } = useTenantId();

  const query = useQuery({
    queryKey: ['burnout-predictions', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('burnout_predictions')
        .select('*')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .order('predicted_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Deduplicate: keep latest per employee
      const latest: Record<string, any> = {};
      (data ?? []).forEach(row => {
        if (!latest[row.employee_id]) latest[row.employee_id] = row;
      });

      return Object.values(latest) as BurnoutPrediction[];
    },
    enabled: !!tenantId,
    staleTime: 5 * 60_000,
  });

  const highRisk = (query.data ?? []).filter(p => p.burnout_probability_score > 60);

  return {
    predictions: query.data ?? [],
    highRisk,
    isPending: query.isPending,
  };
}
