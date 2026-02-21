import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { subDays, format, eachDayOfInterval, getDay, parseISO } from 'date-fns';

export type TimeRange = 7 | 30 | 90 | 'custom';

export interface OrgFilter {
  branchId?: string;
  divisionId?: string;
  departmentId?: string;
  sectionId?: string;
}

export interface CategoryScore {
  id: string;
  name: string;
  nameAr: string | null;
  color: string;
  avgScore: number;
  responseCount: number;
}

export interface SubcategoryScore {
  id: string;
  name: string;
  nameAr: string | null;
  color: string;
  categoryName: string;
  categoryNameAr: string | null;
  avgScore: number;
  responseCount: number;
}

export interface AffectiveDistribution {
  state: 'positive' | 'neutral' | 'negative';
  count: number;
  percentage: number;
}

export interface DayOfWeekActivity {
  day: number;
  count: number;
}

export interface OrgAnalyticsData {
  activeEmployees: number;
  avgMoodScore: number;
  participationRate: number;
  surveyResponseRate: number;
  riskPercentage: number;
  avgStreak: number;
  moodTrend: { date: string; avg: number; count: number; responseCount: number }[];
  moodDistribution: { level: string; count: number; percentage: number }[];
  categoryScores: CategoryScore[];
  subcategoryScores: SubcategoryScore[];
  affectiveDistribution: AffectiveDistribution[];
  dayOfWeekActivity: DayOfWeekActivity[];
}

function hasOrgFilter(f?: OrgFilter): boolean {
  return !!(f?.branchId || f?.divisionId || f?.departmentId || f?.sectionId);
}

async function resolveFilteredEmployeeIds(orgFilter: OrgFilter): Promise<string[] | null> {
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
    // Resolve departments under this division first
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

// Helper to batch .in() queries for large arrays (Supabase limit)
function batchIn<T>(ids: string[], batchSize = 500): string[][] {
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    batches.push(ids.slice(i, i + batchSize));
  }
  return batches;
}

export function useOrgAnalytics(
  timeRange: TimeRange = 30,
  customStart?: string,
  customEnd?: string,
  orgFilter?: OrgFilter
) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['org-analytics', user?.id, timeRange, customStart, customEnd,
      orgFilter?.branchId, orgFilter?.divisionId, orgFilter?.departmentId, orgFilter?.sectionId],
    queryFn: async (): Promise<OrgAnalyticsData> => {
      // Determine date range
      let startDate: string;
      let endDate: string;
      let rangeStart: Date;
      let rangeEnd: Date;

      if (timeRange === 'custom' && customStart && customEnd) {
        startDate = customStart;
        endDate = customEnd;
        rangeStart = parseISO(customStart);
        rangeEnd = parseISO(customEnd);
      } else {
        const days = typeof timeRange === 'number' ? timeRange : 30;
        rangeEnd = new Date();
        rangeStart = subDays(rangeEnd, days);
        startDate = format(rangeStart, 'yyyy-MM-dd');
        endDate = format(rangeEnd, 'yyyy-MM-dd');
      }

      // Resolve filtered employee IDs if org filter active
      let filteredIds: string[] | null = null;
      if (hasOrgFilter(orgFilter)) {
        filteredIds = await resolveFilteredEmployeeIds(orgFilter!);
        if (filteredIds.length === 0) {
          return emptyResult();
        }
      }

      // 1. Active employees (scoped)
      let empQuery = supabase
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .is('deleted_at', null);
      if (filteredIds) empQuery = empQuery.in('id', filteredIds);
      const { count: activeEmployees } = await empQuery;
      const totalActive = activeEmployees ?? 0;

      // 2. Mood entries
      let moodQuery = supabase
        .from('mood_entries')
        .select('mood_score, mood_level, entry_date, employee_id')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);
      if (filteredIds) moodQuery = moodQuery.in('employee_id', filteredIds);
      const { data: moodEntries } = await moodQuery;
      const entries = moodEntries ?? [];

      // 3. Average mood
      const avgMoodScore = entries.length > 0
        ? Math.round((entries.reduce((s, e) => s + e.mood_score, 0) / entries.length) * 10) / 10
        : 0;

      // 4. Participation
      const uniqueEmployees = new Set(entries.map(e => e.employee_id)).size;
      const participationRate = totalActive > 0 ? Math.round((uniqueEmployees / totalActive) * 100) : 0;

      // 5. Risk
      const riskCount = entries.filter(e => e.mood_score <= 2).length;
      const riskPercentage = entries.length > 0 ? Math.round((riskCount / entries.length) * 100) : 0;

      // 6. Streak
      const employeeEntryMap: Record<string, string[]> = {};
      entries.forEach(e => {
        if (!employeeEntryMap[e.employee_id]) employeeEntryMap[e.employee_id] = [];
        employeeEntryMap[e.employee_id].push(e.entry_date);
      });
      let totalStreaks = 0, streakEmployees = 0;
      Object.values(employeeEntryMap).forEach(dates => {
        const sorted = [...new Set(dates)].sort();
        let maxStreak = 1, currentStreak = 1;
        for (let i = 1; i < sorted.length; i++) {
          const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
          if (diff === 1) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
          else { currentStreak = 1; }
        }
        totalStreaks += maxStreak;
        streakEmployees++;
      });
      const avgStreak = streakEmployees > 0 ? Math.round((totalStreaks / streakEmployees) * 10) / 10 : 0;

      // 7. Mood distribution
      const levelCounts: Record<string, number> = {};
      entries.forEach(e => { levelCounts[e.mood_level] = (levelCounts[e.mood_level] ?? 0) + 1; });
      const moodDistribution = Object.entries(levelCounts)
        .map(([level, count]) => ({
          level, count,
          percentage: entries.length > 0 ? Math.round((count / entries.length) * 100) : 0,
        }));

      // 8. Daily trend
      const dailyMap: Record<string, { total: number; count: number }> = {};
      entries.forEach(e => {
        if (!dailyMap[e.entry_date]) dailyMap[e.entry_date] = { total: 0, count: 0 };
        dailyMap[e.entry_date].total += e.mood_score;
        dailyMap[e.entry_date].count += 1;
      });

      let respQuery = supabase
        .from('employee_responses')
        .select('responded_at')
        .gte('responded_at', `${startDate}T00:00:00`)
        .lte('responded_at', `${endDate}T23:59:59`);
      if (filteredIds) respQuery = respQuery.in('employee_id', filteredIds);
      const { data: responses } = await respQuery;

      const responseDailyMap: Record<string, number> = {};
      (responses ?? []).forEach(r => {
        if (r.responded_at) {
          const d = r.responded_at.slice(0, 10);
          responseDailyMap[d] = (responseDailyMap[d] ?? 0) + 1;
        }
      });

      const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
      const moodTrend = allDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const entry = dailyMap[dateStr];
        return {
          date: dateStr,
          avg: entry ? Math.round((entry.total / entry.count) * 10) / 10 : 0,
          count: entry?.count ?? 0,
          responseCount: responseDailyMap[dateStr] ?? 0,
        };
      });

      // 9. Survey response rate
      let schedQuery = supabase
        .from('scheduled_questions')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_delivery', `${startDate}T00:00:00`);
      if (filteredIds) schedQuery = schedQuery.in('employee_id', filteredIds);
      const { count: totalScheduled } = await schedQuery;

      let answeredQuery = supabase
        .from('employee_responses')
        .select('id', { count: 'exact', head: true })
        .gte('responded_at', `${startDate}T00:00:00`);
      if (filteredIds) answeredQuery = answeredQuery.in('employee_id', filteredIds);
      const { count: answeredCount } = await answeredQuery;

      const surveyResponseRate = (totalScheduled ?? 0) > 0
        ? Math.round(((answeredCount ?? 0) / (totalScheduled ?? 1)) * 100)
        : 0;

      // 10. Category / subcategory / affective scores
      let catRespQuery = supabase
        .from('employee_responses')
        .select('answer_value, question_id')
        .gte('responded_at', `${startDate}T00:00:00`)
        .lte('responded_at', `${endDate}T23:59:59`);
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

        const categoryIds = [...new Set((questions ?? []).map(q => q.category_id).filter(Boolean))] as string[];
        const { data: categories } = categoryIds.length > 0
          ? await supabase.from('question_categories').select('id, name, name_ar, color').in('id', categoryIds)
          : { data: [] };
        const categoryMap = new Map((categories ?? []).map(c => [c.id, c]));

        const subcategoryIds = [...new Set((questions ?? []).map(q => q.subcategory_id).filter(Boolean))] as string[];
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
          const numVal = typeof r.answer_value === 'number' ? r.answer_value
            : typeof r.answer_value === 'string' ? parseFloat(r.answer_value) : null;

          if (q.category_id && numVal !== null && !isNaN(numVal)) {
            if (!catAgg[q.category_id]) catAgg[q.category_id] = { total: 0, count: 0 };
            catAgg[q.category_id].total += numVal;
            catAgg[q.category_id].count += 1;
          }
          if (q.subcategory_id && numVal !== null && !isNaN(numVal)) {
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

      // 11. Day-of-week activity
      const dowCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
      (responses ?? []).forEach(r => {
        if (r.responded_at) { dowCounts[getDay(new Date(r.responded_at))]++; }
      });
      entries.forEach(e => { dowCounts[getDay(new Date(e.entry_date))]++; });
      const dayOfWeekActivity: DayOfWeekActivity[] = dowCounts.map((count, day) => ({ day, count }));

      return {
        activeEmployees: totalActive, avgMoodScore, participationRate, surveyResponseRate,
        riskPercentage, avgStreak, moodTrend, moodDistribution, categoryScores,
        subcategoryScores, affectiveDistribution, dayOfWeekActivity,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return { data, isLoading };
}

function emptyResult(): OrgAnalyticsData {
  return {
    activeEmployees: 0, avgMoodScore: 0, participationRate: 0, surveyResponseRate: 0,
    riskPercentage: 0, avgStreak: 0, moodTrend: [], moodDistribution: [],
    categoryScores: [], subcategoryScores: [], affectiveDistribution: [], dayOfWeekActivity: [],
  };
}
