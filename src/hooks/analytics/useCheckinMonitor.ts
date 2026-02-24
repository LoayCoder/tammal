import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, parseISO } from 'date-fns';
import type { OrgFilters } from '@/hooks/analytics/useSurveyMonitor';

export type DateRange = 'today' | '7d' | '30d';

export interface ParticipationStats {
  totalEmployees: number;
  checkedInToday: number;
  notCheckedIn: number;
  participationRate: number;
  avgMoodScore: number;
  avgMoodScoreYesterday: number | null;
  avgStreak: number;
}

export interface MoodBreakdownItem {
  moodLevel: string;
  label: string;
  emoji: string;
  color: string;
  count: number;
  percent: number;
}

export interface CheckinDepartmentStat {
  departmentId: string;
  departmentName: string;
  departmentNameAr: string | null;
  totalEmployees: number;
  checkedIn: number;
  rate: number;
  avgMood: number;
}

export interface CheckinEmployeeRow {
  employeeId: string;
  employeeName: string;
  departmentName: string;
  departmentNameAr: string | null;
  checkedInToday: boolean;
  moodLevel: string | null;
  moodEmoji: string | null;
  moodScore: number | null;
  streak: number;
  lastCheckinDate: string | null;
}

export interface CheckinTrendPoint {
  date: string;
  avgMood: number;
  participationCount: number;
  participationRate: number;
}

export interface RiskAlert {
  type: 'low_mood' | 'disengaged' | 'low_department';
  label: string;
  detail: string;
  employeeId?: string;
  departmentId?: string;
}

export function useCheckinMonitor(
  tenantId?: string,
  dateRange: DateRange = 'today',
  filters?: OrgFilters
) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const rangeStart = (() => {
    if (dateRange === '7d') return format(subDays(new Date(), 6), 'yyyy-MM-dd');
    if (dateRange === '30d') return format(subDays(new Date(), 29), 'yyyy-MM-dd');
    return today;
  })();

  const coreQuery = useQuery({
    queryKey: ['checkin-monitor', tenantId, dateRange, filters?.branchId, filters?.divisionId, filters?.departmentId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant');

      // 1. Fetch active employees
      const { data: employees, error: empErr } = await supabase
        .from('employees')
        .select('id, full_name, department_id, branch_id')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .is('deleted_at', null);
      if (empErr) throw empErr;

      // 2. Fetch departments
      const { data: departments, error: deptErr } = await supabase
        .from('departments')
        .select('id, name, name_ar, division_id, branch_id')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null);
      if (deptErr) throw deptErr;

      // 3. Fetch mood_entries for date range
      const { data: moodEntries, error: moodErr } = await supabase
        .from('mood_entries' as any)
        .select('id, employee_id, entry_date, mood_level, mood_score, streak_count')
        .eq('tenant_id', tenantId)
        .gte('entry_date', rangeStart)
        .lte('entry_date', today);
      if (moodErr) throw moodErr;

      // 4. Fetch yesterday's entries for comparison
      const { data: yesterdayEntries, error: yErr } = await supabase
        .from('mood_entries' as any)
        .select('mood_score')
        .eq('tenant_id', tenantId)
        .eq('entry_date', yesterday);
      if (yErr) throw yErr;

      // 5. Fetch mood_definitions for emoji/color mapping
      const { data: moodDefs, error: mdErr } = await supabase
        .from('mood_definitions' as any)
        .select('key, emoji, label_en, label_ar, color, score, sort_order')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('sort_order');
      if (mdErr) throw mdErr;

      return {
        employees: employees ?? [],
        departments: departments ?? [],
        moodEntries: (moodEntries as any[]) ?? [],
        yesterdayEntries: (yesterdayEntries as any[]) ?? [],
        moodDefs: (moodDefs as any[]) ?? [],
      };
    },
    enabled: !!tenantId,
  });

  const computed = (() => {
    const raw = coreQuery.data;
    if (!raw) {
      return {
        participationStats: { totalEmployees: 0, checkedInToday: 0, notCheckedIn: 0, participationRate: 0, avgMoodScore: 0, avgMoodScoreYesterday: null, avgStreak: 0 } as ParticipationStats,
        moodBreakdown: [] as MoodBreakdownItem[],
        departmentStats: [] as CheckinDepartmentStat[],
        employeeList: [] as CheckinEmployeeRow[],
        trendData: [] as CheckinTrendPoint[],
        riskAlerts: [] as RiskAlert[],
      };
    }

    const { employees, departments, moodEntries, yesterdayEntries, moodDefs } = raw;

    const deptMap = new Map(departments.map(d => [d.id, d]));
    const moodDefMap = new Map(moodDefs.map((m: any) => [m.key, m]));

    // Apply org filters
    let filteredEmployees = employees;
    if (filters?.branchId || filters?.divisionId || filters?.departmentId) {
      filteredEmployees = employees.filter(e => {
        if (filters.departmentId && e.department_id !== filters.departmentId) return false;
        if (filters.branchId && e.branch_id !== filters.branchId) return false;
        if (filters.divisionId) {
          const dept = e.department_id ? deptMap.get(e.department_id) : null;
          if (!dept || dept.division_id !== filters.divisionId) return false;
        }
        return true;
      });
    }

    const filteredEmpIds = new Set(filteredEmployees.map(e => e.id));
    const filteredMoodEntries = moodEntries.filter((m: any) => filteredEmpIds.has(m.employee_id));

    // Today's entries
    const todayEntries = filteredMoodEntries.filter((m: any) => m.entry_date === today);
    const todayByEmployee = new Map<string, any>();
    todayEntries.forEach((m: any) => todayByEmployee.set(m.employee_id, m));

    // Participation stats
    const totalEmployees = filteredEmployees.length;
    const checkedInToday = todayByEmployee.size;
    const notCheckedIn = totalEmployees - checkedInToday;
    const participationRate = totalEmployees > 0 ? Math.round((checkedInToday / totalEmployees) * 100) : 0;

    const todayScores = todayEntries.map((m: any) => m.mood_score as number);
    const avgMoodScore = todayScores.length > 0
      ? Math.round((todayScores.reduce((a: number, b: number) => a + b, 0) / todayScores.length) * 10) / 10
      : 0;

    const yScores = yesterdayEntries.map((m: any) => m.mood_score as number);
    const avgMoodScoreYesterday = yScores.length > 0
      ? Math.round((yScores.reduce((a: number, b: number) => a + b, 0) / yScores.length) * 10) / 10
      : null;

    const todayStreaks = todayEntries.map((m: any) => (m.streak_count as number) || 0);
    const avgStreak = todayStreaks.length > 0
      ? Math.round((todayStreaks.reduce((a: number, b: number) => a + b, 0) / todayStreaks.length) * 10) / 10
      : 0;

    const participationStats: ParticipationStats = {
      totalEmployees, checkedInToday, notCheckedIn, participationRate,
      avgMoodScore, avgMoodScoreYesterday, avgStreak,
    };

    // Mood breakdown
    const moodCounts = new Map<string, number>();
    todayEntries.forEach((m: any) => {
      moodCounts.set(m.mood_level, (moodCounts.get(m.mood_level) ?? 0) + 1);
    });
    const moodBreakdown: MoodBreakdownItem[] = moodDefs.map((d: any) => {
      const count = moodCounts.get(d.key) ?? 0;
      return {
        moodLevel: d.key,
        label: d.label_en,
        emoji: d.emoji,
        color: d.color,
        count,
        percent: todayEntries.length > 0 ? Math.round((count / todayEntries.length) * 100) : 0,
      };
    }).filter((m: MoodBreakdownItem) => m.count > 0);

    // Department stats
    const deptGroups = new Map<string, { total: number; checkedIn: number; moods: number[] }>();
    filteredEmployees.forEach(e => {
      const dId = e.department_id ?? 'unassigned';
      const cur = deptGroups.get(dId) ?? { total: 0, checkedIn: 0, moods: [] };
      cur.total++;
      const entry = todayByEmployee.get(e.id);
      if (entry) {
        cur.checkedIn++;
        cur.moods.push(entry.mood_score);
      }
      deptGroups.set(dId, cur);
    });

    const departmentStats: CheckinDepartmentStat[] = Array.from(deptGroups.entries())
      .map(([dId, s]) => ({
        departmentId: dId,
        departmentName: deptMap.get(dId)?.name ?? 'Unassigned',
        departmentNameAr: deptMap.get(dId)?.name_ar ?? null,
        totalEmployees: s.total,
        checkedIn: s.checkedIn,
        rate: s.total > 0 ? Math.round((s.checkedIn / s.total) * 100) : 0,
        avgMood: s.moods.length > 0 ? Math.round((s.moods.reduce((a, b) => a + b, 0) / s.moods.length) * 10) / 10 : 0,
      }))
      .sort((a, b) => a.rate - b.rate);

    // Employee list
    const employeeList: CheckinEmployeeRow[] = filteredEmployees.map(e => {
      const dept = e.department_id ? deptMap.get(e.department_id) : null;
      const entry = todayByEmployee.get(e.id);
      // Find last check-in across all fetched entries
      const empEntries = filteredMoodEntries
        .filter((m: any) => m.employee_id === e.id)
        .sort((a: any, b: any) => b.entry_date.localeCompare(a.entry_date));
      const lastEntry = empEntries[0];

      const moodDef = entry ? moodDefMap.get(entry.mood_level) : null;

      return {
        employeeId: e.id,
        employeeName: e.full_name,
        departmentName: dept?.name ?? 'Unassigned',
        departmentNameAr: dept?.name_ar ?? null,
        checkedInToday: !!entry,
        moodLevel: entry?.mood_level ?? null,
        moodEmoji: moodDef?.emoji ?? null,
        moodScore: entry?.mood_score ?? null,
        streak: entry?.streak_count ?? 0,
        lastCheckinDate: lastEntry?.entry_date ?? null,
      };
    });

    // Trend data
    const dateGroups = new Map<string, { scores: number[]; count: number }>();
    filteredMoodEntries.forEach((m: any) => {
      const cur = dateGroups.get(m.entry_date) ?? { scores: [], count: 0 };
      cur.scores.push(m.mood_score);
      cur.count++;
      dateGroups.set(m.entry_date, cur);
    });

    const trendData: CheckinTrendPoint[] = Array.from(dateGroups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        avgMood: Math.round((d.scores.reduce((a, b) => a + b, 0) / d.scores.length) * 10) / 10,
        participationCount: d.count,
        participationRate: totalEmployees > 0 ? Math.round((d.count / totalEmployees) * 100) : 0,
      }));

    // Risk alerts
    const riskAlerts: RiskAlert[] = [];

    // Low mood: employees with 3+ consecutive low scores (<=2)
    const empEntriesByEmp = new Map<string, any[]>();
    filteredMoodEntries.forEach((m: any) => {
      const arr = empEntriesByEmp.get(m.employee_id) ?? [];
      arr.push(m);
      empEntriesByEmp.set(m.employee_id, arr);
    });
    const empNameMap = new Map(filteredEmployees.map(e => [e.id, e.full_name]));

    empEntriesByEmp.forEach((entries, empId) => {
      const sorted = [...entries].sort((a: any, b: any) => b.entry_date.localeCompare(a.entry_date));
      let consecutiveLow = 0;
      for (const e of sorted) {
        if (e.mood_score <= 2) consecutiveLow++;
        else break;
      }
      if (consecutiveLow >= 3) {
        riskAlerts.push({
          type: 'low_mood',
          label: empNameMap.get(empId) ?? 'Unknown',
          detail: `${consecutiveLow} consecutive low mood entries`,
          employeeId: empId,
        });
      }
    });

    // Disengaged: employees who haven't checked in for 3+ days (only if range >= 7d)
    if (dateRange !== 'today') {
      filteredEmployees.forEach(e => {
        const entries = empEntriesByEmp.get(e.id) ?? [];
        if (entries.length === 0) {
          riskAlerts.push({
            type: 'disengaged',
            label: e.full_name,
            detail: 'No check-ins in selected period',
            employeeId: e.id,
          });
          return;
        }
        const latest = [...entries].sort((a: any, b: any) => b.entry_date.localeCompare(a.entry_date))[0];
        const daysSince = Math.floor((new Date().getTime() - new Date(latest.entry_date).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince >= 3) {
          riskAlerts.push({
            type: 'disengaged',
            label: e.full_name,
            detail: `${daysSince} days since last check-in`,
            employeeId: e.id,
          });
        }
      });
    }

    // Low department engagement
    departmentStats.forEach(d => {
      if (d.rate < 50 && d.totalEmployees > 0) {
        riskAlerts.push({
          type: 'low_department',
          label: d.departmentName,
          detail: `${d.rate}% participation`,
          departmentId: d.departmentId,
        });
      }
    });

    return { participationStats, moodBreakdown, departmentStats, employeeList, trendData, riskAlerts };
  })();

  return {
    ...computed,
    isLoading: coreQuery.isLoading,
    refetch: coreQuery.refetch,
  };
}
