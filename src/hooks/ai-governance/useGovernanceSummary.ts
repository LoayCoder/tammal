import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GovernanceSummaryRow {
  tenant_id: string;
  feature: string;
  projected_monthly_cost: number | null;
  burn_rate: number | null;
  sla_risk_level: string | null;
  performance_drift_score: number | null;
  forecast_updated: string | null;
  provider: string | null;
  model: string | null;
  scope: string | null;
  ewma_latency_ms: number | null;
  ewma_quality: number | null;
  ewma_success_rate: number | null;
  ewma_cost_per_1k: number | null;
  cost_ewma: number | null;
  sample_count: number | null;
  ts_alpha: number | null;
  ts_beta: number | null;
  last_call_at: string | null;
  calls_last_24h: number | null;
  usage_percentage: number | null;
}

export function useGovernanceSummary() {
  return useQuery({
    queryKey: ['ai-governance', 'summary'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-governance', {
        body: { action: 'get_summary' },
      });
      if (error) throw error;
      return (data?.data ?? []) as GovernanceSummaryRow[];
    },
    staleTime: 60_000,
  });
}
