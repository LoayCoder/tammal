import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface TeamMemberLoad {
  employeeId: string;
  employeeName: string;
  department: string | null;
  totalTasks: number;
  activeTasks: number;
  doneTasks: number;
  estimatedMinutes: number;
  overdueTasks: number;
  offHoursSessions: number;
  offHoursMinutes: number;
}

export interface ObjProgress {
  id: string;
  title: string;
  quarter: string;
  year: number;
  progress: number;
  status: string;
  initiativeCount: number;
  actionCount: number;
  completedActions: number;
}

export function useWorkloadAnalytics() {
  const { tenantId } = useTenantId();

  const teamLoadQuery = useQuery({
    queryKey: ['workload-team-load', tenantId],
    queryFn: async () => {
      // Get all employees with their tasks
      const { data: employees, error: empErr } = await supabase
        .from('employees')
        .select('id, full_name, department')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .eq('status', 'active');
      if (empErr) throw empErr;

      const todayStr = new Date().toISOString().split('T')[0];

      // Get all active tasks
      const { data: tasks, error: taskErr } = await supabase
        .from('unified_tasks')
        .select('employee_id, status, estimated_minutes, due_date')
        .is('deleted_at', null);
      if (taskErr) throw taskErr;

      // Get off-hours sessions
      const { data: offHours, error: ohErr } = await supabase
        .from('off_hours_sessions')
        .select('employee_id, total_minutes')
        .is('deleted_at', null);
      if (ohErr) throw ohErr;

      const result: TeamMemberLoad[] = (employees ?? []).map(emp => {
        const empTasks = (tasks ?? []).filter(t => t.employee_id === emp.id);
        const active = empTasks.filter(t => t.status !== 'done');
        const done = empTasks.filter(t => t.status === 'done');
        const overdue = active.filter(t => t.due_date && t.due_date.split('T')[0] < todayStr);
        const empOH = (offHours ?? []).filter(o => o.employee_id === emp.id);

        return {
          employeeId: emp.id,
          employeeName: emp.full_name,
          department: emp.department,
          totalTasks: empTasks.length,
          activeTasks: active.length,
          doneTasks: done.length,
          estimatedMinutes: active.reduce((s, t) => s + (t.estimated_minutes ?? 0), 0),
          overdueTasks: overdue.length,
          offHoursSessions: empOH.length,
          offHoursMinutes: empOH.reduce((s, o) => s + (o.total_minutes ?? 0), 0),
        };
      });

      return result;
    },
    enabled: !!tenantId,
  });

  const objProgressQuery = useQuery({
    queryKey: ['workload-obj-progress', tenantId],
    queryFn: async () => {
      const { data: objs, error: objErr } = await supabase
        .from('strategic_objectives')
        .select('id, title, quarter, year, progress, status')
        .is('deleted_at', null)
        .order('year', { ascending: false });
      if (objErr) throw objErr;

      const { data: initiatives, error: initErr } = await supabase
        .from('initiatives')
        .select('id, objective_id')
        .is('deleted_at', null);
      if (initErr) throw initErr;

      const { data: actions, error: actErr } = await supabase
        .from('objective_actions')
        .select('id, initiative_id, status')
        .is('deleted_at', null);
      if (actErr) throw actErr;

      const result: ObjProgress[] = (objs ?? []).map(obj => {
        const inits = (initiatives ?? []).filter(i => i.objective_id === obj.id);
        const initIds = new Set(inits.map(i => i.id));
        const acts = (actions ?? []).filter(a => initIds.has(a.initiative_id));
        const completed = acts.filter(a => a.status === 'completed');

        return {
          ...obj,
          initiativeCount: inits.length,
          actionCount: acts.length,
          completedActions: completed.length,
        };
      });

      return result;
    },
    enabled: !!tenantId,
  });

  // Aggregate stats
  const teamLoad = teamLoadQuery.data ?? [];
  const totalEmployees = teamLoad.length;
  const avgLoad = totalEmployees > 0
    ? Math.round(teamLoad.reduce((s, t) => s + t.estimatedMinutes, 0) / totalEmployees)
    : 0;
  const atRiskCount = teamLoad.filter(t => t.estimatedMinutes > 480 || t.overdueTasks > 2).length;
  const offHoursWorkers = teamLoad.filter(t => t.offHoursMinutes > 60).length;

  return {
    teamLoad,
    objProgress: objProgressQuery.data ?? [],
    isPending: teamLoadQuery.isPending || objProgressQuery.isPending,
    totalEmployees,
    avgLoadMinutes: avgLoad,
    atRiskCount,
    offHoursWorkers,
  };
}
