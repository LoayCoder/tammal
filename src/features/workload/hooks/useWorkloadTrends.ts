import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface WorkloadTrend {
  currentUtilization: number;
  previousUtilization: number;
  currentBurnoutCount: number;
  previousBurnoutCount: number;
  currentVelocity: number;
  previousVelocity: number;
  currentCompletion: number;
  previousCompletion: number;
}

export function useWorkloadTrends() {
  const { tenantId } = useTenantId();

  return useQuery({
    queryKey: ['workload-trends', tenantId],
    queryFn: async (): Promise<WorkloadTrend> => {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const twoWeeksAgo = new Date(now);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const todayStr = now.toISOString().split('T')[0];
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

      // Current week heatmap
      const { data: currentHeatmap } = await supabase
        .from('workload_heatmap_metrics')
        .select('utilization_pct, classification')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .gte('snapshot_date', weekAgoStr)
        .lte('snapshot_date', todayStr);

      // Previous week heatmap
      const { data: prevHeatmap } = await supabase
        .from('workload_heatmap_metrics')
        .select('utilization_pct, classification')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .gte('snapshot_date', twoWeeksAgoStr)
        .lt('snapshot_date', weekAgoStr);

      const avg = (arr: any[], key: string) =>
        arr.length > 0 ? Math.round(arr.reduce((s, r) => s + (r[key] ?? 0), 0) / arr.length) : 0;

      const burnoutCount = (arr: any[]) => arr.filter(r => r.classification === 'burnout_risk').length;

      // Current week velocity
      const { data: currentVel } = await supabase
        .from('execution_velocity_metrics')
        .select('actions_completed')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .gte('period_end', weekAgoStr);

      const { data: prevVel } = await supabase
        .from('execution_velocity_metrics')
        .select('actions_completed')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .gte('period_end', twoWeeksAgoStr)
        .lt('period_end', weekAgoStr);

      const sumCompleted = (arr: any[]) => arr.reduce((s, r) => s + (r.actions_completed ?? 0), 0);

      return {
        currentUtilization: avg(currentHeatmap ?? [], 'utilization_pct'),
        previousUtilization: avg(prevHeatmap ?? [], 'utilization_pct'),
        currentBurnoutCount: burnoutCount(currentHeatmap ?? []),
        previousBurnoutCount: burnoutCount(prevHeatmap ?? []),
        currentVelocity: sumCompleted(currentVel ?? []),
        previousVelocity: sumCompleted(prevVel ?? []),
        currentCompletion: (currentVel ?? []).length,
        previousCompletion: (prevVel ?? []).length,
      };
    },
    enabled: !!tenantId,
    staleTime: 10 * 60_000,
  });
}
