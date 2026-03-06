import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface TaskActivityLog {
  id: string;
  task_id: string;
  action: string;
  performed_by: string;
  details: Record<string, unknown>;
  tenant_id: string;
  created_at: string;
  employee?: { full_name: string } | null;
}

export function useTaskActivity(taskId?: string) {
  const { tenantId } = useTenantId();

  const query = useQuery({
    queryKey: ['task-activity', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_activity_logs')
        .select('*, employee:employees!task_activity_logs_performed_by_fkey(full_name)')
        .eq('task_id', taskId!)
        .eq('tenant_id', tenantId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as TaskActivityLog[];
    },
    enabled: !!taskId && !!tenantId,
  });

  return {
    activities: query.data ?? [],
    isPending: query.isPending,
  };
}
