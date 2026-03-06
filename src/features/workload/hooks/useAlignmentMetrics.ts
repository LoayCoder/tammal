import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface AlignmentMetric {
  id: string;
  user_id: string;
  aligned_actions: number;
  total_actions: number;
  alignment_score: number;
  snapshot_date: string;
}

export function useAlignmentMetrics() {
  const { tenantId } = useTenantId();

  const query = useQuery({
    queryKey: ['alignment-metrics', tenantId],
    queryFn: async () => {
      const { data: latest } = await supabase
        .from('strategic_alignment_metrics')
        .select('snapshot_date')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .order('snapshot_date', { ascending: false })
        .limit(1);

      const latestDate = latest?.[0]?.snapshot_date;
      if (!latestDate) return [];

      const { data, error } = await supabase
        .from('strategic_alignment_metrics')
        .select('*')
        .eq('tenant_id', tenantId!)
        .eq('snapshot_date', latestDate)
        .is('deleted_at', null);
      if (error) throw error;
      return (data ?? []) as AlignmentMetric[];
    },
    enabled: !!tenantId,
    staleTime: 5 * 60_000,
  });

  const metrics = query.data ?? [];
  const avgScore = metrics.length > 0
    ? Math.round(metrics.reduce((s, m) => s + m.alignment_score, 0) / metrics.length)
    : 0;

  return {
    metrics,
    avgScore,
    isPending: query.isPending,
  };
}
