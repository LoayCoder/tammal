import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface HeatmapMetric {
  id: string;
  employee_id: string;
  department_id: string | null;
  utilization_pct: number;
  classification: string;
  snapshot_date: string;
}

export function useWorkloadHeatmap() {
  const { tenantId } = useTenantId();

  const query = useQuery({
    queryKey: ['workload-heatmap', tenantId],
    queryFn: async () => {
      // Get latest snapshot date
      const { data: latest } = await supabase
        .from('workload_heatmap_metrics')
        .select('snapshot_date')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .order('snapshot_date', { ascending: false })
        .limit(1);

      const latestDate = latest?.[0]?.snapshot_date;
      if (!latestDate) return [];

      const { data, error } = await supabase
        .from('workload_heatmap_metrics')
        .select('*')
        .eq('tenant_id', tenantId!)
        .eq('snapshot_date', latestDate)
        .is('deleted_at', null);
      if (error) throw error;
      return (data ?? []) as HeatmapMetric[];
    },
    enabled: !!tenantId,
    staleTime: 5 * 60_000,
  });

  const metrics = query.data ?? [];

  const distribution = {
    underutilized: metrics.filter(m => m.classification === 'underutilized').length,
    healthy: metrics.filter(m => m.classification === 'healthy').length,
    high_load: metrics.filter(m => m.classification === 'high_load').length,
    burnout_risk: metrics.filter(m => m.classification === 'burnout_risk').length,
  };

  return {
    metrics,
    distribution,
    isPending: query.isPending,
  };
}
