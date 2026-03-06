import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useCallback } from 'react';
import {
  calculateUtilization,
  detectBurnoutRisk,
  computeAlignmentScore,
  upsertWorkloadMetrics,
} from '@/services/workload-intelligence.service';

export interface WorkloadMetric {
  id: string;
  tenant_id: string;
  employee_id: string;
  utilization_percentage: number;
  burnout_risk_score: number;
  alignment_score: number;
  updated_at: string;
}

export function useWorkloadMetrics(employeeId?: string) {
  const { tenantId } = useTenantId();
  const queryClient = useQueryClient();

  const queryKey = ['workload-metrics', tenantId, employeeId];

  const metricsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('workload_metrics')
        .select('*')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null);
      if (employeeId) query = query.eq('employee_id', employeeId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as WorkloadMetric[];
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 2,
  });

  /**
   * Recompute metrics for a single employee and persist.
   */
  const recomputeMutation = useMutation({
    mutationFn: async (empId: string) => {
      if (!tenantId) throw new Error('No tenant');
      const [util, burnout, alignment] = await Promise.all([
        calculateUtilization(empId, tenantId),
        detectBurnoutRisk(empId, tenantId),
        computeAlignmentScore(empId, tenantId),
      ]);
      await upsertWorkloadMetrics(tenantId, empId, {
        utilization_percentage: util.utilization,
        burnout_risk_score: burnout.score,
        alignment_score: alignment.score,
      });
      return { util, burnout, alignment };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workload-metrics', tenantId] });
    },
  });

  const getMetricsFor = useCallback(
    (empId: string): WorkloadMetric | undefined =>
      metricsQuery.data?.find(m => m.employee_id === empId),
    [metricsQuery.data],
  );

  return {
    metrics: metricsQuery.data ?? [],
    isPending: metricsQuery.isPending,
    recomputeMetrics: recomputeMutation.mutate,
    isRecomputing: recomputeMutation.isPending,
    getMetricsFor,
  };
}
