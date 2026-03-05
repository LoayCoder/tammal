import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface InitiativeRiskMetric {
  id: string;
  initiative_id: string;
  overdue_score: number;
  velocity_score: number;
  resource_score: number;
  escalation_score: number;
  risk_score: number;
  snapshot_date: string;
}

export function useInitiativeRisk() {
  const { tenantId } = useTenantId();

  const query = useQuery({
    queryKey: ['initiative-risk', tenantId],
    queryFn: async () => {
      // Get latest snapshot
      const { data: latest } = await supabase
        .from('initiative_risk_metrics')
        .select('snapshot_date')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .order('snapshot_date', { ascending: false })
        .limit(1);

      const latestDate = latest?.[0]?.snapshot_date;
      if (!latestDate) return [];

      const { data, error } = await supabase
        .from('initiative_risk_metrics')
        .select('*')
        .eq('tenant_id', tenantId!)
        .eq('snapshot_date', latestDate)
        .is('deleted_at', null)
        .order('risk_score', { ascending: false });
      if (error) throw error;
      return (data ?? []) as InitiativeRiskMetric[];
    },
    enabled: !!tenantId,
    staleTime: 5 * 60_000,
  });

  const metrics = query.data ?? [];
  const highRisk = metrics.filter(m => m.risk_score > 60);
  const mediumRisk = metrics.filter(m => m.risk_score > 30 && m.risk_score <= 60);

  return {
    metrics,
    highRisk,
    mediumRisk,
    isPending: query.isPending,
  };
}
