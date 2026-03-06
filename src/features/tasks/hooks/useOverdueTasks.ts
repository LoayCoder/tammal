import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';

export function useOverdueTasks() {
  const { tenantId } = useTenantId();

  const { data: overdueTasks = [], isPending } = useQuery({
    queryKey: ['overdue-tasks', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_tasks')
        .select('*, employee:employees!unified_tasks_employee_id_fkey(full_name)')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .eq('archived', false)
        .not('status', 'in', '("completed","verified","archived","rejected")')
        .lt('due_date', new Date().toISOString())
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  return { overdueTasks, isPending };
}
