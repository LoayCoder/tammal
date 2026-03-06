import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';

interface DirectReport {
  id: string;
  full_name: string;
  role_title: string | null;
  department: string | null;
}

export function useManagerTaskOverview() {
  const { tenantId } = useTenantId();
  const { employee, isPending: empLoading } = useCurrentEmployee();

  const { data: directReports = [], isPending: reportsLoading } = useQuery({
    queryKey: ['direct-reports', employee?.id, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, role_title, department')
        .eq('manager_id', employee!.id)
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .eq('status', 'active')
        .order('full_name');
      if (error) throw error;
      return data as DirectReport[];
    },
    enabled: !!employee?.id && !!tenantId,
  });

  const reportIds = directReports.map(r => r.id);

  const { data: allTasks = [], isPending: tasksLoading } = useQuery({
    queryKey: ['manager-team-tasks', reportIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_tasks')
        .select('id, employee_id, status, priority, progress, due_date')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .in('employee_id', reportIds);
      if (error) throw error;
      return data;
    },
    enabled: reportIds.length > 0 && !!tenantId,
  });

  return { directReports, allTasks, empLoading, reportsLoading, tasksLoading, employee };
}

export type { DirectReport };
