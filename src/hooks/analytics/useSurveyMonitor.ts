import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SurveyParticipationStats {
  totalTargeted: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  expired: number;
  failed: number;
  completionPercent: number;
}

export interface DepartmentStat {
  departmentId: string;
  departmentName: string;
  departmentNameAr: string | null;
  total: number;
  completed: number;
  rate: number;
}

export interface SnapshotPoint {
  date: string;
  completionPercent: number;
  totalTargeted: number;
  completed: number;
}

export function useSurveyMonitor(scheduleId?: string, tenantId?: string) {
  // Fetch active survey schedules for the selector
  const schedulesQuery = useQuery({
    queryKey: ['survey-monitor-schedules', tenantId],
    queryFn: async () => {
      let query = supabase
        .from('question_schedules')
        .select('id, name, status, start_date, end_date, schedule_type, target_audience, created_at')
        .eq('schedule_type', 'survey')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });

  // Fetch participation stats for a specific schedule
  const statsQuery = useQuery({
    queryKey: ['survey-monitor-stats', scheduleId],
    queryFn: async (): Promise<SurveyParticipationStats> => {
      if (!scheduleId) throw new Error('No schedule selected');

      // Get all scheduled_questions for this schedule
      const { data: sq, error: sqError } = await supabase
        .from('scheduled_questions')
        .select('id, status, employee_id')
        .eq('schedule_id', scheduleId);

      if (sqError) throw sqError;

      const total = sq?.length ?? 0;
      const sqIds = sq?.map(s => s.id) ?? [];

      // Get draft responses
      let draftCount = 0;
      if (sqIds.length > 0) {
        const { count, error: draftError } = await supabase
          .from('employee_responses')
          .select('id', { count: 'exact', head: true })
          .in('scheduled_question_id', sqIds)
          .eq('is_draft', true)
          .is('deleted_at', null);

        if (!draftError) draftCount = count ?? 0;
      }

      const answered = sq?.filter(s => s.status === 'answered').length ?? 0;
      const expired = sq?.filter(s => s.status === 'expired').length ?? 0;
      const failed = sq?.filter(s => s.status === 'failed').length ?? 0;
      const pending = sq?.filter(s => s.status === 'pending' || s.status === 'delivered').length ?? 0;
      const notStarted = pending - draftCount > 0 ? pending - draftCount : pending;

      return {
        totalTargeted: total,
        notStarted: Math.max(notStarted, 0),
        inProgress: draftCount,
        completed: answered,
        expired,
        failed,
        completionPercent: total > 0 ? Math.round((answered / total) * 100) : 0,
      };
    },
    enabled: !!scheduleId,
  });

  // Department-level breakdown
  const departmentStatsQuery = useQuery({
    queryKey: ['survey-monitor-departments', scheduleId],
    queryFn: async (): Promise<DepartmentStat[]> => {
      if (!scheduleId) return [];

      const { data: sq, error: sqError } = await supabase
        .from('scheduled_questions')
        .select('id, status, employee_id')
        .eq('schedule_id', scheduleId);

      if (sqError) throw sqError;
      if (!sq || sq.length === 0) return [];

      const employeeIds = [...new Set(sq.map(s => s.employee_id))];

      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, department_id')
        .in('id', employeeIds);

      if (empError) throw empError;

      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('id, name, name_ar')
        .is('deleted_at', null);

      if (deptError) throw deptError;

      const empDeptMap = new Map<string, string | null>();
      employees?.forEach(e => empDeptMap.set(e.id, e.department_id));

      const deptStats = new Map<string, { total: number; completed: number }>();

      sq.forEach(item => {
        const deptId = empDeptMap.get(item.employee_id) ?? 'unassigned';
        const current = deptStats.get(deptId) ?? { total: 0, completed: 0 };
        current.total++;
        if (item.status === 'answered') current.completed++;
        deptStats.set(deptId, current);
      });

      const deptMap = new Map<string, { name: string; name_ar: string | null }>();
      departments?.forEach(d => deptMap.set(d.id, { name: d.name, name_ar: d.name_ar }));

      return Array.from(deptStats.entries()).map(([deptId, s]) => ({
        departmentId: deptId,
        departmentName: deptMap.get(deptId)?.name ?? 'Unassigned',
        departmentNameAr: deptMap.get(deptId)?.name_ar ?? null,
        total: s.total,
        completed: s.completed,
        rate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
      })).sort((a, b) => a.rate - b.rate);
    },
    enabled: !!scheduleId,
  });

  // Trend snapshots
  const snapshotsQuery = useQuery({
    queryKey: ['survey-monitor-snapshots', scheduleId],
    queryFn: async (): Promise<SnapshotPoint[]> => {
      if (!scheduleId) return [];

      const { data, error } = await supabase
        .from('survey_monitor_snapshots' as any)
        .select('snapshot_date, stats')
        .eq('schedule_id', scheduleId)
        .order('snapshot_date', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        date: row.snapshot_date,
        completionPercent: row.stats?.completionPercent ?? 0,
        totalTargeted: row.stats?.totalTargeted ?? 0,
        completed: row.stats?.completed ?? 0,
      }));
    },
    enabled: !!scheduleId,
  });

  return {
    schedules: schedulesQuery.data ?? [],
    schedulesLoading: schedulesQuery.isLoading,
    stats: statsQuery.data,
    statsLoading: statsQuery.isLoading,
    departmentStats: departmentStatsQuery.data ?? [],
    departmentStatsLoading: departmentStatsQuery.isLoading,
    snapshots: snapshotsQuery.data ?? [],
    snapshotsLoading: snapshotsQuery.isLoading,
    refetchStats: statsQuery.refetch,
  };
}
