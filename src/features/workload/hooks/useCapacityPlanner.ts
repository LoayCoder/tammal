import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';

export interface CapacityEmployee {
  id: string;
  name: string;
  department: string | null;
  dailyCapacity: number; // minutes
  tasks: CapacityTask[];
  totalLoad: number; // minutes
  utilizationPct: number;
}

export interface CapacityTask {
  id: string;
  title: string;
  status: string;
  priority: number;
  estimatedMinutes: number;
  dueDate: string | null;
  employeeId: string;
}

export function useCapacityPlanner() {
  const { tenantId } = useTenantId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['capacity-planner', tenantId],
    queryFn: async (): Promise<CapacityEmployee[]> => {
      const { data: employees } = await supabase
        .from('employees')
        .select('id, full_name, department')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .eq('status', 'active');

      const { data: capacities } = await supabase
        .from('employee_capacity')
        .select('user_id, daily_capacity_minutes')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null);

      const { data: tasks } = await supabase
        .from('unified_tasks')
        .select('id, title, status, priority, estimated_minutes, due_date, employee_id')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .not('status', 'in', '("completed","verified","archived")');

      const capMap = new Map((capacities ?? []).map(c => [c.user_id, c.daily_capacity_minutes]));

      return (employees ?? []).map(emp => {
        const empTasks: CapacityTask[] = (tasks ?? [])
          .filter(t => t.employee_id === emp.id)
          .map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            estimatedMinutes: t.estimated_minutes ?? 30,
            dueDate: t.due_date,
            employeeId: emp.id,
          }));

        const totalLoad = empTasks.reduce((s, t) => s + t.estimatedMinutes, 0);
        const dailyCap = capMap.get(emp.id) ?? 480;
        const utilizationPct = dailyCap > 0 ? Math.round((totalLoad / dailyCap) * 100) : 0;

        return {
          id: emp.id,
          name: emp.full_name,
          department: emp.department,
          dailyCapacity: dailyCap,
          tasks: empTasks,
          totalLoad,
          utilizationPct,
        };
      }).sort((a, b) => b.utilizationPct - a.utilizationPct);
    },
    enabled: !!tenantId,
  });

  const reassignTask = useMutation({
    mutationFn: async ({ taskId, toEmployeeId }: { taskId: string; toEmployeeId: string }) => {
      const { error } = await supabase
        .from('unified_tasks')
        .update({ employee_id: toEmployeeId, assignee_id: toEmployeeId })
        .eq('id', taskId)
        .eq('tenant_id', tenantId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capacity-planner'] });
      toast.success('Task reassigned successfully');
    },
    onError: () => {
      toast.error('Failed to reassign task');
    },
  });

  return {
    employees: query.data ?? [],
    isPending: query.isPending,
    reassignTask,
  };
}
