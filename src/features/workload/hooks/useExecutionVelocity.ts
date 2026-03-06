import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface VelocityMetric {
  id: string;
  department_id: string | null;
  initiative_id: string | null;
  actions_completed: number;
  period_start: string;
  period_end: string;
  velocity_score: number;
}

export function useExecutionVelocity() {
  const { tenantId } = useTenantId();

  const query = useQuery({
    queryKey: ['execution-velocity', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('execution_velocity_metrics')
        .select('*')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .order('period_end', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as VelocityMetric[];
    },
    enabled: !!tenantId,
    staleTime: 5 * 60_000,
  });

  const metrics = query.data ?? [];

  // Aggregate: total velocity = sum of completed / avg period days
  const totalCompleted = metrics.reduce((s, m) => s + m.actions_completed, 0);
  const avgVelocity = metrics.length > 0
    ? Math.round(metrics.reduce((s, m) => s + m.velocity_score, 0) / metrics.length * 100) / 100
    : 0;

  return {
    metrics,
    totalCompleted,
    avgVelocity,
    isPending: query.isPending,
  };
}
