// ── Low-level Supabase query helpers for analytics ──────────
// Extracted from the monolithic useOrgAnalytics hook.

import { supabase } from '@/integrations/supabase/client';
import type { OrgFilter, MoodEntry, OrgComparison, OrgUnitComparison, TopEngager } from './analyticsTypes';

// ── Org filter helpers ──

export function hasOrgFilter(f?: OrgFilter): boolean {
  return !!(f?.branchId || f?.divisionId || f?.departmentId || f?.sectionId);
}

export async function resolveFilteredEmployeeIds(orgFilter: OrgFilter): Promise<string[] | null> {
  let query = supabase
    .from('employees')
    .select('id')
    .eq('status', 'active')
    .is('deleted_at', null);

  if (orgFilter.sectionId) {
    query = query.eq('section_id', orgFilter.sectionId);
  } else if (orgFilter.departmentId) {
    query = query.eq('department_id', orgFilter.departmentId);
  } else if (orgFilter.divisionId) {
    const { data: depts } = await supabase
      .from('departments')
      .select('id')
      .eq('division_id', orgFilter.divisionId)
      .is('deleted_at', null);
    const deptIds = (depts ?? []).map(d => d.id);
    if (deptIds.length === 0) return [];
    query = query.in('department_id', deptIds);
  } else if (orgFilter.branchId) {
    query = query.eq('branch_id', orgFilter.branchId);
  }

  const { data } = await query;
  return (data ?? []).map(e => e.id);
}

// ── Batch helpers ──

function batchIn(ids: string[], batchSize = 500): string[][] {
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    batches.push(ids.slice(i, i + batchSize));
  }
  return batches;
}

export async function batchedQuery<T>(
  baseBuilder: () => any,
  column: string,
  ids: string[],
): Promise<T[]> {
  if (ids.length <= 500) {
    const { data } = await baseBuilder().in(column, ids);
    return (data ?? []) as T[];
  }
  const batches = batchIn(ids);
  const results: T[] = [];
  for (const batch of batches) {
    const { data } = await baseBuilder().in(column, batch);
    results.push(...((data ?? []) as T[]));
  }
  return results;
}

// ── Mood entry fetching ──

export async function fetchMoodEntries(
  startDate: string,
  endDate: string,
  filteredIds: string[] | null,
): Promise<MoodEntry[]> {
  if (filteredIds && filteredIds.length > 500) {
    return batchedQuery<MoodEntry>(
      () => supabase.from('mood_entries')
        .select('mood_score, mood_level, entry_date, employee_id, support_actions, streak_count, created_at')
        .gte('entry_date', startDate).lte('entry_date', endDate).limit(10000),
      'employee_id', filteredIds,
    );
  }
  let q = supabase
    .from('mood_entries')
    .select('mood_score, mood_level, entry_date, employee_id, support_actions, streak_count, created_at')
    .gte('entry_date', startDate).lte('entry_date', endDate).limit(10000);
  if (filteredIds) q = q.in('employee_id', filteredIds);
  const { data } = await q;
  return data ?? [];
}

// ── Active employee count ──

export async function fetchActiveEmployeeCount(filteredIds: string[] | null): Promise<number> {
  let q = supabase
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .is('deleted_at', null);
  if (filteredIds) q = q.in('id', filteredIds);
  const { count } = await q;
  return count ?? 0;
}

// ── Survey response rate ──

export async function fetchSurveyResponseRate(
  startDate: string,
  endDate: string,
  filteredIds: string[] | null,
): Promise<number> {
  const { data: surveySchedules } = await supabase
    .from('question_schedules')
    .select('id')
    .eq('schedule_type', 'survey')
    .eq('status', 'active')
    .is('deleted_at', null);
  const surveyScheduleIds = (surveySchedules ?? []).map(s => s.id);

  let totalScheduled = 0;
  if (surveyScheduleIds.length > 0) {
    let schedQuery = supabase
      .from('scheduled_questions')
      .select('id', { count: 'exact', head: true })
      .in('schedule_id', surveyScheduleIds)
      .gte('scheduled_delivery', `${startDate}T00:00:00`)
      .lte('scheduled_delivery', `${endDate}T23:59:59`);
    if (filteredIds) schedQuery = schedQuery.in('employee_id', filteredIds);
    const { count } = await schedQuery;
    totalScheduled = count ?? 0;
  }

  let answeredQuery = supabase
    .from('employee_responses')
    .select('id', { count: 'exact', head: true })
    .eq('is_draft', false)
    .gte('responded_at', `${startDate}T00:00:00`)
    .lte('responded_at', `${endDate}T23:59:59`);
  if (filteredIds) answeredQuery = answeredQuery.in('employee_id', filteredIds);
  const { count: answeredCount } = await answeredQuery;

  return totalScheduled > 0
    ? Math.round(((answeredCount ?? 0) / totalScheduled) * 100)
    : 0;
}

// ── Org Comparison ──

export async function computeOrgComparison(
  entries: { mood_score: number; employee_id: string; entry_date: string }[],
  filteredIds: string[] | null,
): Promise<OrgComparison> {
  let empQuery = supabase
    .from('employees')
    .select('id, full_name, branch_id, department_id, section_id')
    .eq('status', 'active')
    .is('deleted_at', null);
  if (filteredIds) empQuery = empQuery.in('id', filteredIds);
  const { data: employees } = await empQuery;
  const emps = employees ?? [];

  const branchIds = [...new Set(emps.map(e => e.branch_id).filter(Boolean))] as string[];
  const deptIds = [...new Set(emps.map(e => e.department_id).filter(Boolean))] as string[];
  const sectionIds = [...new Set(emps.map(e => e.section_id).filter(Boolean))] as string[];

  const [{ data: branches }, { data: departments }, { data: sections }] = await Promise.all([
    branchIds.length > 0 ? supabase.from('branches').select('id, name, name_ar').in('id', branchIds) : Promise.resolve({ data: [] }),
    deptIds.length > 0 ? supabase.from('departments').select('id, name, name_ar, division_id').in('id', deptIds) : Promise.resolve({ data: [] }),
    sectionIds.length > 0 ? supabase.from('sites').select('id, name, name_ar').in('id', sectionIds) : Promise.resolve({ data: [] }),
  ]);

  const divisionIds = [...new Set((departments ?? []).map(d => (d as any).division_id).filter(Boolean))] as string[];
  const { data: divisions } = divisionIds.length > 0
    ? await supabase.from('divisions').select('id, name, name_ar').in('id', divisionIds)
    : { data: [] };

  function buildUnitStats(
    unitList: { id: string; name: string; name_ar?: string | null }[],
    getEmployeeIds: (unitId: string) => string[],
  ): OrgUnitComparison[] {
    return unitList.map(unit => {
      const unitEmpIds = getEmployeeIds(unit.id);
      const unitEntries = entries.filter(e => unitEmpIds.includes(e.employee_id));
      const avgScore = unitEntries.length > 0
        ? Math.round((unitEntries.reduce((s, e) => s + e.mood_score, 0) / unitEntries.length) * 10) / 10
        : 0;
      const uniqueParticipants = new Set(unitEntries.map(e => e.employee_id)).size;
      const participation = unitEmpIds.length > 0 ? Math.round((uniqueParticipants / unitEmpIds.length) * 100) : 0;
      const atRisk = unitEntries.filter(e => e.mood_score <= 2).length;
      const riskPct = unitEntries.length > 0 ? Math.round((atRisk / unitEntries.length) * 100) : 0;
      return { id: unit.id, name: unit.name, nameAr: unit.name_ar ?? null, avgScore, participation, riskPct, employeeCount: unitEmpIds.length };
    }).filter(u => u.employeeCount > 0);
  }

  return {
    branches: buildUnitStats(branches ?? [], uid => emps.filter(e => e.branch_id === uid).map(e => e.id)),
    divisions: buildUnitStats(divisions ?? [], uid => {
      const divDepts = (departments ?? []).filter(d => (d as any).division_id === uid).map(d => d.id);
      return emps.filter(e => e.department_id && divDepts.includes(e.department_id)).map(e => e.id);
    }),
    departments: buildUnitStats(departments ?? [], uid => emps.filter(e => e.department_id === uid).map(e => e.id)),
    sections: buildUnitStats(sections ?? [], uid => emps.filter(e => e.section_id === uid).map(e => e.id)),
  };
}

// ── Top Engagers ──

export async function computeTopEngagers(
  entries: { mood_score: number; employee_id: string; entry_date: string }[],
  filteredIds: string[] | null,
  startDate: string,
  endDate: string,
): Promise<TopEngager[]> {
  const empMap: Record<string, string[]> = {};
  entries.forEach(e => {
    if (!empMap[e.employee_id]) empMap[e.employee_id] = [];
    empMap[e.employee_id].push(e.entry_date);
  });

  const streaks: { employeeId: string; streak: number }[] = [];
  Object.entries(empMap).forEach(([empId, dates]) => {
    const sorted = [...new Set(dates)].sort().reverse();
    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const latest = new Date(sorted[0]);
    latest.setHours(0, 0, 0, 0);
    const diffFromToday = (today.getTime() - latest.getTime()) / 86400000;
    if (diffFromToday > 1) {
      streaks.push({ employeeId: empId, streak: 0 });
      return;
    }
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i - 1]).getTime() - new Date(sorted[i]).getTime()) / 86400000;
      if (diff === 1) streak++;
      else break;
    }
    streaks.push({ employeeId: empId, streak });
  });

  const empIds = Object.keys(empMap);
  if (empIds.length === 0) return [];

  let respQuery = supabase
    .from('employee_responses')
    .select('employee_id')
    .gte('responded_at', `${startDate}T00:00:00`)
    .lte('responded_at', `${endDate}T23:59:59`)
    .limit(10000);
  if (filteredIds) respQuery = respQuery.in('employee_id', filteredIds);
  const { data: responses } = await respQuery;

  const respCounts: Record<string, number> = {};
  (responses ?? []).forEach(r => {
    respCounts[r.employee_id] = (respCounts[r.employee_id] ?? 0) + 1;
  });

  const merged = streaks.map(s => ({
    ...s,
    responseCount: respCounts[s.employeeId] ?? 0,
    totalPoints: (entries.filter(e => e.employee_id === s.employeeId).length * 10) + (s.streak * 5),
  }));
  merged.sort((a, b) => b.streak - a.streak || b.responseCount - a.responseCount);
  const top10 = merged.slice(0, 10);

  const top10Ids = top10.map(t => t.employeeId);
  const { data: empData } = await supabase
    .from('employees')
    .select('id, full_name, department_id')
    .in('id', top10Ids);

  const deptIds = [...new Set((empData ?? []).map(e => e.department_id).filter(Boolean))] as string[];
  const { data: depts } = deptIds.length > 0
    ? await supabase.from('departments').select('id, name, name_ar').in('id', deptIds)
    : { data: [] };
  const deptMap = new Map((depts ?? []).map(d => [d.id, { name: d.name, nameAr: (d as any).name_ar }]));
  const empLookup = new Map((empData ?? []).map(e => [e.id, e]));

  return top10.map(t => {
    const emp = empLookup.get(t.employeeId);
    const firstName = emp?.full_name?.split(' ')[0] ?? '—';
    const deptInfo = emp?.department_id ? deptMap.get(emp.department_id) : null;
    return { employeeId: t.employeeId, firstName, department: deptInfo?.name ?? '—', departmentAr: deptInfo?.nameAr ?? null, streak: t.streak, responseCount: t.responseCount, totalPoints: t.totalPoints };
  });
}

// ── Answer value parser (reused across analytics) ──

export function parseAnswerValue(av: any): number | null {
  if (typeof av === 'number') return av;
  if (typeof av === 'string') {
    const n = parseFloat(av);
    return isNaN(n) ? null : n;
  }
  if (typeof av === 'object' && av !== null && !Array.isArray(av)) {
    const objVal = av.value ?? av.score ?? null;
    if (typeof objVal === 'number') return objVal;
    if (typeof objVal === 'string') {
      const n = parseFloat(objVal);
      return isNaN(n) ? null : n;
    }
  }
  return null;
}
