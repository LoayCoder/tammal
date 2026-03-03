import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SandboxEvaluation {
  id: string;
  tenant_id: string;
  feature: string;
  provider: string;
  model: string;
  status: 'active' | 'promoted' | 'disabled' | 'expired';
  traffic_percentage: number;
  started_at: string;
  expires_at: string;
  calls_total: number;
  calls_success: number;
  avg_latency: number | null;
  avg_cost: number | null;
  median_quality: number | null;
}

export function useSandboxEvaluations() {
  return useQuery({
    queryKey: ['ai-governance', 'sandbox-evaluations'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-governance', {
        body: { action: 'get_sandbox_evaluations' },
      });
      if (error) throw error;
      return (data?.data ?? []) as SandboxEvaluation[];
    },
    staleTime: 30_000,
  });
}
