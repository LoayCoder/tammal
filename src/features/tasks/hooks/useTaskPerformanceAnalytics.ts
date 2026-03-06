import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useMemo } from 'react';
import { startOfDay, subDays } from 'date-fns';

export function useTaskPerformanceAnalytics(range: string) {
  const { tenantId } = useTenantId();

  const sinceDate = useMemo(() => startOfDay(subDays(new Date(), Number(range))).toISOString(), [range]);

  const { data: tasks, isPending } = useQuery({
    queryKey: ['task-perf-analytics', tenantId, range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_tasks')
        .select('id, status, priority, progress, created_at, updated_at, employee_id, employees!unified_tasks_employee_id_fkey(full_name)')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .gte('created_at', sinceDate)
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });

  return { tasks, isPending, sinceDate };
}
