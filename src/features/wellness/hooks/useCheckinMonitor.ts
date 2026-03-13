import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import type { OrgFilters } from '@/hooks/analytics/useSurveyMonitor';
import type { Database } from '@/integrations/supabase/types';

export type DateRange = 'today' | '7d' | '30d' | 'ytd';

type MoodEntryRow = Database['public']['Tables']['mood_entries']['Row'];
type MoodDefinitionRow = Database['public']['Tables']['mood_definitions']['Row'];

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
  labelAr: string;
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
  detailKey: string;
  detailParams: Record<string, string | number>;
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
    if (dateRange === 'ytd') {
      const now = new Date();
      return format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd');
    }
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

      // 3. Fetch mood_entries for date range (with limit to prevent truncation)
      const { data: moodEntries, error: moodErr } = await supabase
        .from('mood_entries')
        .select('id, employee_id, entry_date, mood_level, mood_score, streak_count')
        .eq('tenant_id', tenantId)
        .gte('entry_date', rangeStart)
        .lte('entry_date', today)
        .limit(5000);
      if (moodErr) throw moodErr;

      // 4. Fetch yesterday's entries for comparison
      const { data: yesterdayEntries, error: yErr } = await supabase
        .from('mood_entries')
        .select('employee_id, mood_score')
        .eq('tenant_id', tenantId)
        .eq('entry_date', yesterday)
        .limit(5000);
      if (yErr) throw yErr;

      // 5. Fetch mood_definitions for emoji/color mapping
      const { data: moodDefs, error: mdErr } = await supabase
        .from('mood_definitions')
        .select('key, emoji, label_en, label_ar, color, score, sort_order')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('sort_order');
      if (mdErr) throw mdErr;

      return {
        employees: employees ?? [],
        departments: departments ?? [],
        moodEntries: (moodEntries ?? []) as MoodEntryRow[],
        yesterdayEntries: (yesterdayEntries ?? []) as Pick<MoodEntryRow, 'employee_id' | 'mood_score'>[],
        moodDefs: (moodDefs ?? []) as MoodDefinitionRow[],
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
    const moodDefMap = new Map(moodDefs.map(m => [m.key, m]));

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
    const filteredMoodEntries = moodEntries.filter(m => filteredEmpIds.has(m.employee_id));

    // Today's entries
    const todayEntries = filteredMoodEntries.filter(m => m.entry_date === today);
    const todayByEmployee = new Map<string, MoodEntryRow>();
    todayEntries.forEach(m => todayByEmployee.set(m.employee_id, m));

    // Participation stats
    const totalEmployees = filteredEmployees.length;
    const checkedInToday = todayByEmployee.size;
    const notCheckedIn = totalEmployees - checkedInToday;
    const participationRate = totalEmployees > 0 ? Math.round((checkedInToday / totalEmployees) * 100) : 0;

    const todayScores = todayEntries.map(m => m.mood_score);
    const avgMoodScore = todayScores.length > 0
      ? Math.round((todayScores.reduce((a, b) => a + b, 0) / todayScores.length) * 10) / 10
      : 0;

    // Filter yesterday entries through same org filters
    const filteredYesterdayEntries = yesterdayEntries.filter(m => filteredEmpIds.has(m.employee_id));
    const yScores = filteredYesterdayEntries.map(m => m.mood_score);
    const avgMoodScoreYesterday = yScores.length > 0
      ? Math.round((yScores.reduce((a, b) => a + b, 0) / yScores.length) * 10) / 10
      : null;

    const todayStreaks = todayEntries.map(m => m.streak_count || 0);
    const avgStreak = todayStreaks.length > 0
      ? Math.round((todayStreaks.reduce((a, b) => a + b, 0) / todayStreaks.length) * 10) / 10
      : 0;

    const participationStats: ParticipationStats = {
      totalEmployees, checkedInToday, notCheckedIn, participationRate,
      avgMoodScore, avgMoodScoreYesterday, avgStreak,
    };

    // Mood breakdown (bilingual)
    const moodCounts = new Map<string, number>();
    todayEntries.forEach(m => {
      moodCounts.set(m.mood_level, (moodCounts.get(m.mood_level) ?? 0) + 1);
    });
    const moodBreakdown: MoodBreakdownItem[] = moodDefs.map(d => {
      const count = moodCounts.get(d.key) ?? 0;
      return {
        moodLevel: d.key,
        label: d.label_en,
        labelAr: d.label_ar,
        emoji: d.emoji,
        color: d.color,
        count,
        percent: todayEntries.length > 0 ? Math.round((count / todayEntries.length) * 100) : 0,
      };
    }).filter(m => m.count > 0);

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
      const empEntries = filteredMoodEntries
        .filter(m => m.employee_id === e.id)
        .sort((a, b) => b.entry_date.localeCompare(a.entry_date));
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
    filteredMoodEntries.forEach(m => {
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

    // Risk alerts (with i18n-ready detail keys)
    const riskAlerts: RiskAlert[] = [];

    const empEntriesByEmp = new Map<string, MoodEntryRow[]>();
    filteredMoodEntries.forEach(m => {
      const arr = empEntriesByEmp.get(m.employee_id) ?? [];
      arr.push(m);
      empEntriesByEmp.set(m.employee_id, arr);
    });
    const empNameMap = new Map(filteredEmployees.map(e => [e.id, e.full_name]));

    // Low mood: 3+ consecutive low scores
    empEntriesByEmp.forEach((entries, empId) => {
      const sorted = [...entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date));
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
          detailKey: 'checkinMonitor.risk.consecutiveLowDetail',
          detailParams: { count: consecutiveLow },
          employeeId: empId,
        });
      }
    });

    // Disengaged: 3+ days no check-in
    if (dateRange !== 'today') {
      filteredEmployees.forEach(e => {
        const entries = empEntriesByEmp.get(e.id) ?? [];
        if (entries.length === 0) {
          riskAlerts.push({
            type: 'disengaged',
            label: e.full_name,
            detail: 'No check-ins in selected period',
            detailKey: 'checkinMonitor.risk.noCheckinsDetail',
            detailParams: {},
            employeeId: e.id,
          });
          return;
        }
        const latest = [...entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date))[0];
        const daysSince = Math.floor((new Date().getTime() - new Date(latest.entry_date).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince >= 3) {
          riskAlerts.push({
            type: 'disengaged',
            label: e.full_name,
            detail: `${daysSince} days since last check-in`,
            detailKey: 'checkinMonitor.risk.daysSinceDetail',
            detailParams: { days: daysSince },
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
          detailKey: 'checkinMonitor.risk.participationDetail',
          detailParams: { rate: d.rate },
          departmentId: d.departmentId,
        });
      }
    });

    return { participationStats, moodBreakdown, departmentStats, employeeList, trendData, riskAlerts };
  })();

  return {
    ...computed,
    isPending: coreQuery.isPending && coreQuery.isFetching,
    refetch: coreQuery.refetch,
  };
}
