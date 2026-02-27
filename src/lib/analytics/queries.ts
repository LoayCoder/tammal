// ── All Supabase query logic for analytics ──
// No React imports. May call services (gamificationService).

import { supabase } from '@/integrations/supabase/client';
import { computeStreak, calculatePoints } from '@/services/gamificationService';
import { format } from 'date-fns';
import type {
  OrgFilter, MoodEntry, OrgComparison, OrgUnitComparison,
  TopEngager, CategoryScore, SubcategoryScore, AffectiveDistribution,
  CategoryTrendPoint, CategoryMoodCell, TrendOverlayPoint, PeriodComparison,
} from './types';
import { computePeriodComparison } from './computations/riskScore';

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

  let answeredCount = 0;
  if (surveyScheduleIds.length > 0) {
    let sqQuery = supabase
      .from('scheduled_questions')
      .select('id')
      .in('schedule_id', surveyScheduleIds)
      .gte('scheduled_delivery', `${startDate}T00:00:00`)
      .lte('scheduled_delivery', `${endDate}T23:59:59`);
    if (filteredIds) sqQuery = sqQuery.in('employee_id', filteredIds);
    const { data: sqData } = await sqQuery;
    const sqIds = (sqData ?? []).map(sq => sq.id);

    if (sqIds.length > 0) {
      const { count } = await supabase
        .from('employee_responses')
        .select('id', { count: 'exact', head: true })
        .in('scheduled_question_id', sqIds)
        .eq('is_draft', false)
        .is('deleted_at', null);
      answeredCount = count ?? 0;
    }
  }

  return totalScheduled > 0
    ? Math.round((answeredCount / totalScheduled) * 100)
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
    const streak = computeStreak(dates.map(d => ({ entry_date: d })));
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

  const merged = streaks.map(s => {
    const empEntries = entries.filter(e => e.employee_id === s.employeeId);
    let totalPoints = 0;
    for (let i = 0; i < empEntries.length; i++) {
      totalPoints += calculatePoints(i);
    }
    return {
      ...s,
      responseCount: respCounts[s.employeeId] ?? 0,
      totalPoints,
    };
  });
  merged.sort((a, b) => b.streak - a.streak || b.responseCount - a.responseCount);
  const top10 = merged.slice(0, 10);

  const top10Ids = top10.map(t => t.employeeId);
  const { data: empData } = await supabase
    .from('employees')
    .select('id, full_name, department_id')
    .in('id', top10Ids);

  const deptIdsArr = [...new Set((empData ?? []).map(e => e.department_id).filter(Boolean))] as string[];
  const { data: depts } = deptIdsArr.length > 0
    ? await supabase.from('departments').select('id, name, name_ar').in('id', deptIdsArr)
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

// ── Answer value parser ──

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

// ── Category Analysis (extracted from useOrgAnalytics inline) ──

export async function fetchCategoryAnalysis(
  startDate: string,
  endDate: string,
  filteredIds: string[] | null,
): Promise<{
  categoryScores: CategoryScore[];
  subcategoryScores: SubcategoryScore[];
  affectiveDistribution: AffectiveDistribution[];
  catResponses: { answer_value: any; question_id: string }[];
}> {
  let catRespQuery = supabase
    .from('employee_responses')
    .select('answer_value, question_id')
    .gte('responded_at', `${startDate}T00:00:00`)
    .lte('responded_at', `${endDate}T23:59:59`)
    .limit(10000);
  if (filteredIds) catRespQuery = catRespQuery.in('employee_id', filteredIds);
  const { data: catResponses } = await catRespQuery;

  const questionIds = [...new Set((catResponses ?? []).map(r => r.question_id))];
  let categoryScores: CategoryScore[] = [];
  let subcategoryScores: SubcategoryScore[] = [];
  let affectiveDistribution: AffectiveDistribution[] = [];

  if (questionIds.length > 0) {
    const { data: questions } = await supabase
      .from('questions')
      .select('id, category_id, subcategory_id, affective_state')
      .in('id', questionIds);

    const questionMap = new Map((questions ?? []).map(q => [q.id, q]));

    const resolvedIds = new Set((questions ?? []).map(q => q.id));
    const missingIds = questionIds.filter(id => !resolvedIds.has(id));
    if (missingIds.length > 0) {
      const { data: genQuestions } = await supabase
        .from('generated_questions')
        .select('id, category_id, subcategory_id, affective_state')
        .in('id', missingIds);
      (genQuestions ?? []).forEach(gq => {
        questionMap.set(gq.id, { id: gq.id, category_id: gq.category_id, subcategory_id: gq.subcategory_id, affective_state: gq.affective_state ?? null });
      });
    }

    const allQuestions = [...questionMap.values()];
    const categoryIds = [...new Set(allQuestions.map(q => q.category_id).filter(Boolean))] as string[];
    const { data: categories } = categoryIds.length > 0
      ? await supabase.from('question_categories').select('id, name, name_ar, color').in('id', categoryIds)
      : { data: [] };
    const categoryMap = new Map((categories ?? []).map(c => [c.id, c]));

    const subcategoryIds = [...new Set(allQuestions.map(q => q.subcategory_id).filter(Boolean))] as string[];
    const { data: subcategories } = subcategoryIds.length > 0
      ? await supabase.from('question_subcategories').select('id, name, name_ar, color, category_id').in('id', subcategoryIds)
      : { data: [] };
    const subcategoryMap = new Map((subcategories ?? []).map(s => [s.id, s]));

    const catAgg: Record<string, { total: number; count: number }> = {};
    const subAgg: Record<string, { total: number; count: number }> = {};
    const affAgg: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };

    (catResponses ?? []).forEach(r => {
      const q = questionMap.get(r.question_id);
      if (!q) return;
      const numVal = parseAnswerValue(r.answer_value);

      if (q.category_id && numVal !== null) {
        if (!catAgg[q.category_id]) catAgg[q.category_id] = { total: 0, count: 0 };
        catAgg[q.category_id].total += numVal;
        catAgg[q.category_id].count += 1;
      }
      if (q.subcategory_id && numVal !== null) {
        if (!subAgg[q.subcategory_id]) subAgg[q.subcategory_id] = { total: 0, count: 0 };
        subAgg[q.subcategory_id].total += numVal;
        subAgg[q.subcategory_id].count += 1;
      }
      if (q.affective_state && affAgg.hasOwnProperty(q.affective_state)) {
        affAgg[q.affective_state]++;
      }
    });

    categoryScores = Object.entries(catAgg)
      .map(([id, { total, count }]) => {
        const cat = categoryMap.get(id);
        return { id, name: cat?.name ?? 'Unknown', nameAr: cat?.name_ar ?? null, color: cat?.color ?? '#3B82F6', avgScore: Math.round((total / count) * 10) / 10, responseCount: count };
      })
      .sort((a, b) => a.avgScore - b.avgScore);

    subcategoryScores = Object.entries(subAgg)
      .map(([id, { total, count }]) => {
        const sub = subcategoryMap.get(id);
        const parentCat = sub?.category_id ? categoryMap.get(sub.category_id) : null;
        return { id, name: sub?.name ?? 'Unknown', nameAr: sub?.name_ar ?? null, color: sub?.color ?? '#3B82F6', categoryName: parentCat?.name ?? 'Unknown', categoryNameAr: parentCat?.name_ar ?? null, avgScore: Math.round((total / count) * 10) / 10, responseCount: count };
      })
      .sort((a, b) => a.avgScore - b.avgScore);

    const totalAff = affAgg.positive + affAgg.neutral + affAgg.negative;
    affectiveDistribution = (['positive', 'neutral', 'negative'] as const).map(state => ({
      state, count: affAgg[state],
      percentage: totalAff > 0 ? Math.round((affAgg[state] / totalAff) * 100) : 0,
    }));
  }

  return { categoryScores, subcategoryScores, affectiveDistribution, catResponses: catResponses ?? [] };
}

// ── Category Trends + Matrix (extracted from useOrgAnalytics inline) ──

export async function computeCategoryTrendsAndMatrix(
  categoryScores: CategoryScore[],
  catResponses: { answer_value: any; question_id: string }[],
  entries: MoodEntry[],
  allDays: Date[],
  startDate: string,
  endDate: string,
  filteredIds: string[] | null,
): Promise<{
  categoryTrends: Map<string, CategoryTrendPoint[]>;
  categoryMoodMatrix: CategoryMoodCell[];
  moodByCategoryData: Map<string, { date: string; label: string; great: number; good: number; okay: number; struggling: number; need_help: number }[]>;
  catNegMap: Map<string, { negativeCount: number; totalCount: number }>;
}> {
  const categoryTrends = new Map<string, CategoryTrendPoint[]>();
  const categoryMoodMatrix: CategoryMoodCell[] = [];
  const moodByCategoryData = new Map<string, { date: string; label: string; great: number; good: number; okay: number; struggling: number; need_help: number }[]>();
  const catNegMap = new Map<string, { negativeCount: number; totalCount: number }>();

  if (categoryScores.length === 0 || catResponses.length === 0) {
    return { categoryTrends, categoryMoodMatrix, moodByCategoryData, catNegMap };
  }

  const questionIds2 = [...new Set(catResponses.map(r => r.question_id))];
  const { data: questions2 } = questionIds2.length > 0
    ? await supabase.from('questions').select('id, category_id').in('id', questionIds2)
    : { data: [] };
  const q2Map = new Map((questions2 ?? []).map(q => [q.id, q]));

  const resolved2 = new Set((questions2 ?? []).map(q => q.id));
  const missing2 = questionIds2.filter(id => !resolved2.has(id));
  if (missing2.length > 0) {
    const { data: genQ2 } = await supabase
      .from('generated_questions')
      .select('id, category_id')
      .in('id', missing2);
    (genQ2 ?? []).forEach(gq => {
      q2Map.set(gq.id, { id: gq.id, category_id: gq.category_id });
    });
  }

  const entryByEmpDate = new Map<string, string>();
  entries.forEach(e => entryByEmpDate.set(`${e.employee_id}_${e.entry_date}`, e.mood_level));

  let q3 = supabase.from('employee_responses').select('answer_value, question_id, responded_at, employee_id')
    .gte('responded_at', `${startDate}T00:00:00`).lte('responded_at', `${endDate}T23:59:59`).limit(10000);
  if (filteredIds) q3 = q3.in('employee_id', filteredIds);
  const { data: r3 } = await q3;
  const catRespWithEmp = r3 ?? [];

  const catDailyAgg: Record<string, Record<string, { total: number; count: number }>> = {};
  const catMoodAgg: Record<string, Record<string, { count: number; totalScore: number }>> = {};
  const catNegAgg: Record<string, { neg: number; total: number }> = {};

  catRespWithEmp.forEach(r => {
    const q = q2Map.get(r.question_id);
    if (!q || !q.category_id) return;
    const catId = q.category_id;
    const dateStr = r.responded_at?.slice(0, 10) ?? '';
    if (!dateStr) return;
    const numVal = parseAnswerValue(r.answer_value);
    if (numVal === null) return;

    if (!catDailyAgg[catId]) catDailyAgg[catId] = {};
    if (!catDailyAgg[catId][dateStr]) catDailyAgg[catId][dateStr] = { total: 0, count: 0 };
    catDailyAgg[catId][dateStr].total += numVal;
    catDailyAgg[catId][dateStr].count += 1;

    if (!catNegAgg[catId]) catNegAgg[catId] = { neg: 0, total: 0 };
    catNegAgg[catId].total += 1;
    if (numVal <= 2) catNegAgg[catId].neg += 1;

    const moodLevel = entryByEmpDate.get(`${r.employee_id}_${dateStr}`) ?? 'okay';
    if (!catMoodAgg[catId]) catMoodAgg[catId] = {};
    if (!catMoodAgg[catId][moodLevel]) catMoodAgg[catId][moodLevel] = { count: 0, totalScore: 0 };
    catMoodAgg[catId][moodLevel].count += 1;
    catMoodAgg[catId][moodLevel].totalScore += numVal;
  });

  categoryScores.forEach(cat => {
    const dailyData = catDailyAgg[cat.id] ?? {};
    categoryTrends.set(cat.id, allDays.map(day => {
      const ds = format(day, 'yyyy-MM-dd');
      const d = dailyData[ds];
      return { date: ds, avgScore: d ? Math.round((d.total / d.count) * 10) / 10 : 0, count: d?.count ?? 0 };
    }));
    const neg = catNegAgg[cat.id];
    catNegMap.set(cat.id, { negativeCount: neg?.neg ?? 0, totalCount: neg?.total ?? 0 });

    const moodDayAgg: Record<string, Record<string, number>> = {};
    catRespWithEmp.forEach(r => {
      const q = q2Map.get(r.question_id);
      if (!q || q.category_id !== cat.id) return;
      const ds = r.responded_at?.slice(0, 10) ?? '';
      if (!ds) return;
      const ml = entryByEmpDate.get(`${r.employee_id}_${ds}`) ?? 'okay';
      if (!moodDayAgg[ds]) moodDayAgg[ds] = {};
      moodDayAgg[ds][ml] = (moodDayAgg[ds][ml] ?? 0) + 1;
    });
    moodByCategoryData.set(cat.id, allDays.map(day => {
      const ds = format(day, 'yyyy-MM-dd');
      const d = moodDayAgg[ds] ?? {};
      return { date: ds, label: format(day, 'dd/MM'), great: d.great ?? 0, good: d.good ?? 0, okay: d.okay ?? 0, struggling: d.struggling ?? 0, need_help: d.need_help ?? 0 };
    }));
  });

  Object.entries(catMoodAgg).forEach(([catId, moods]) => {
    const cat = categoryScores.find(c => c.id === catId);
    Object.entries(moods).forEach(([moodLevel, agg]) => {
      categoryMoodMatrix.push({ categoryId: catId, categoryName: cat?.name ?? 'Unknown', categoryNameAr: cat?.nameAr ?? null, moodLevel, count: agg.count, avgScore: Math.round((agg.totalScore / agg.count) * 10) / 10 });
    });
  });

  return { categoryTrends, categoryMoodMatrix, moodByCategoryData, catNegMap };
}

// ── Period Comparison fetch (extracted from useOrgAnalytics inline) ──

export async function fetchPreviousPeriodComparison(
  rangeStart: Date,
  rangeEnd: Date,
  filteredIds: string[] | null,
  currentMetrics: { avgMood: number; participation: number; risk: number },
  totalActive: number,
): Promise<PeriodComparison | null> {
  const { subDays, format: fmt } = await import('date-fns');
  const rangeDays = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86400000);
  const prevStart = subDays(rangeStart, rangeDays + 1);
  const prevEnd = subDays(rangeStart, 1);
  let prevMoodQ = supabase.from('mood_entries').select('mood_score, mood_level, entry_date, employee_id')
    .gte('entry_date', fmt(prevStart, 'yyyy-MM-dd')).lte('entry_date', fmt(prevEnd, 'yyyy-MM-dd')).limit(10000);
  if (filteredIds) prevMoodQ = prevMoodQ.in('employee_id', filteredIds);
  const { data: prevEntries } = await prevMoodQ;
  if (prevEntries && prevEntries.length > 0) {
    const prevAvg = prevEntries.reduce((s, e) => s + e.mood_score, 0) / prevEntries.length;
    const prevUnique = new Set(prevEntries.map(e => e.employee_id)).size;
    const prevPart = totalActive > 0 ? Math.round((prevUnique / totalActive) * 100) : 0;
    const prevRisk = Math.round((prevEntries.filter(e => e.mood_score <= 2).length / prevEntries.length) * 100);
    return computePeriodComparison(
      currentMetrics,
      { avgMood: Math.round(prevAvg * 10) / 10, participation: prevPart, risk: prevRisk },
    );
  }
  return null;
}

// ── Responses for trend (extracted from useOrgAnalytics inline) ──

export async function fetchResponseDailyMap(
  startDate: string,
  endDate: string,
  filteredIds: string[] | null,
): Promise<{ responseDailyMap: Record<string, number>; responses: { responded_at: string | null }[] }> {
  let respQuery = supabase
    .from('employee_responses')
    .select('responded_at')
    .gte('responded_at', `${startDate}T00:00:00`)
    .lte('responded_at', `${endDate}T23:59:59`)
    .limit(10000);
  if (filteredIds) respQuery = respQuery.in('employee_id', filteredIds);
  const { data: responses } = await respQuery;

  const responseDailyMap: Record<string, number> = {};
  (responses ?? []).forEach(r => {
    if (r.responded_at) {
      const d = r.responded_at.slice(0, 10);
      responseDailyMap[d] = (responseDailyMap[d] ?? 0) + 1;
    }
  });

  return { responseDailyMap, responses: responses ?? [] };
}

// ── Trend Overlay (extracted from useOrgAnalytics inline) ──

export function computeTrendOverlay(
  allDays: Date[],
  dailyMap: Record<string, { total: number; count: number }>,
  responseDailyMap: Record<string, number>,
  categoryHealthScore: number,
): TrendOverlayPoint[] {
  return allDays.map(day => {
    const ds = format(day, 'yyyy-MM-dd');
    const moodEntry = dailyMap[ds];
    return {
      date: ds,
      checkinAvg: moodEntry ? Math.round((moodEntry.total / moodEntry.count) * 10) / 10 : 0,
      surveyAvg: categoryHealthScore > 0 && (responseDailyMap[ds] ?? 0) > 0
        ? categoryHealthScore : 0,
    };
  });
}
