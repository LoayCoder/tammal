import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface TaskQueueItem {
  id: string;
  tenant_id: string;
  action_id: string;
  employee_id: string | null;
  title: string;
  status: string;
  priority: number;
  due_date: string | null;
  source_type: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function useTaskQueue(employeeId?: string) {
  const { tenantId } = useTenantId();

  return useQuery({
    queryKey: ['task-queue-items', tenantId, employeeId],
    queryFn: async () => {
      let query = supabase
        .from('task_queue_items')
        .select('*')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .order('priority', { ascending: true });

      if (employeeId) query = query.eq('employee_id', employeeId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as TaskQueueItem[];
    },
    enabled: !!tenantId,
  });
}
