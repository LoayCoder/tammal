// ── useOrgAnalytics — thin orchestrator ──────────────────────
// Composes domain-specific query & computation modules.
// Types are re-exported from src/lib/analyticsTypes.ts for backward compat.

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { subDays, format, eachDayOfInterval, parseISO } from 'date-fns';

// Re-export all types so existing consumers don't break
export type { TimeRange, OrgFilter, CategoryScore, SubcategoryScore, AffectiveDistribution, DayOfWeekActivity, RiskTrendPoint, OrgUnitComparison, OrgComparison, TopEngager, CheckinMoodOverTimePoint, SupportActionCount, StreakBucket, CheckinByOrgUnitItem, OrgAnalyticsData } from '@/lib/analyticsTypes';
export { emptyResult } from '@/lib/analyticsTypes';
import type { TimeRange, OrgFilter, OrgAnalyticsData, CategoryScore } from '@/lib/analyticsTypes';
import { emptyResult } from '@/lib/analyticsTypes';

import {
  hasOrgFilter, resolveFilteredEmployeeIds, fetchMoodEntries,
  fetchActiveEmployeeCount, fetchSurveyResponseRate,
  computeOrgComparison, computeTopEngagers, parseAnswerValue,
} from '@/lib/analyticsQueries';

import {
  computeKPIs, computeStreaks, computeMoodDistribution, computeDailyTrend,
  computeDayOfWeekActivity, computeRiskTrend, computeCheckinMoodOverTime,
  computeSupportActions, computeStreakDistribution, computeCheckinByOrgUnit,
} from '@/lib/analyticsComputation';

import {
  computeCategoryRiskScores, computeHealthScore, computePeriodComparison,
  detectEarlyWarnings,
  type CategoryTrendPoint, type CategoryMoodCell,
} from '@/lib/wellnessAnalytics';

import {
  computeCheckinPulse, computeSurveyStructural, computeSynthesis,
} from '@/lib/synthesisEngine';

import type { TrendOverlayPoint } from '@/components/dashboard/comparison/TrendOverlayChart';

export function useOrgAnalytics(
  timeRange: TimeRange = 30,
  customStart?: string,
  customEnd?: string,
  orgFilter?: OrgFilter,
) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['org-analytics', user?.id, timeRange, customStart, customEnd,
      orgFilter?.branchId, orgFilter?.divisionId, orgFilter?.departmentId, orgFilter?.sectionId],
    queryFn: async (): Promise<OrgAnalyticsData> => {
      // ── Date range ──
      let startDate: string, endDate: string, rangeStart: Date, rangeEnd: Date;
      if (timeRange === 'custom' && customStart && customEnd) {
        startDate = customStart; endDate = customEnd;
        rangeStart = parseISO(customStart); rangeEnd = parseISO(customEnd);
      } else {
        const days = typeof timeRange === 'number' ? timeRange : 30;
        rangeEnd = new Date(); rangeStart = subDays(rangeEnd, days);
        startDate = format(rangeStart, 'yyyy-MM-dd');
        endDate = format(rangeEnd, 'yyyy-MM-dd');
      }

      // ── Org filter ──
      let filteredIds: string[] | null = null;
      if (hasOrgFilter(orgFilter)) {
        filteredIds = await resolveFilteredEmployeeIds(orgFilter!);
        if (filteredIds.length === 0) return emptyResult();
      }

      // ── Parallel core fetches ──
      const [totalActive, entries, surveyResponseRate] = await Promise.all([
        fetchActiveEmployeeCount(filteredIds),
        fetchMoodEntries(startDate, endDate, filteredIds),
        fetchSurveyResponseRate(startDate, endDate, filteredIds),
      ]);

      // ── KPIs ──
      const { avgMoodScore, participationRate, riskPercentage } = computeKPIs(entries, totalActive);
      const { avgStreak, employeeEntryMap } = computeStreaks(entries);
      const moodDistribution = computeMoodDistribution(entries);

      // ── Responses for trend ──
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

      const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
      const { moodTrend, dailyMap } = computeDailyTrend(entries, allDays, responseDailyMap);
      const dayOfWeekActivity = computeDayOfWeekActivity(entries, responses ?? []);
      const riskTrend = computeRiskTrend(entries, allDays);

      // ── Org comparison + top engagers (parallel) ──
      const [orgComparison, topEngagers] = await Promise.all([
        computeOrgComparison(entries, filteredIds),
        computeTopEngagers(entries, filteredIds, startDate, endDate),
      ]);

      // ── Category / subcategory / affective analysis ──
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
      let subcategoryScores: import('@/lib/analyticsTypes').SubcategoryScore[] = [];
      let affectiveDistribution: import('@/lib/analyticsTypes').AffectiveDistribution[] = [];

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

      // ── Category trends + risk scores ──
      const categoryTrends = new Map<string, CategoryTrendPoint[]>();
      const categoryMoodMatrix: CategoryMoodCell[] = [];
      const moodByCategoryData = new Map<string, { date: string; label: string; great: number; good: number; okay: number; struggling: number; need_help: number }[]>();
      const catNegMap = new Map<string, { negativeCount: number; totalCount: number }>();

      if (categoryScores.length > 0 && (catResponses ?? []).length > 0) {
        const questionIds2 = [...new Set((catResponses ?? []).map(r => r.question_id))];
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
      }

      const categoryRiskScores = computeCategoryRiskScores(categoryScores, categoryScores.map(c => categoryTrends.get(c.id) ?? []), catNegMap);
      const compositeHealthScore = computeHealthScore(avgMoodScore, participationRate, riskPercentage);
      const earlyWarnings = detectEarlyWarnings(categoryRiskScores, categoryTrends, participationRate, riskTrend);

      // ── Period comparison ──
      let periodComparison: import('@/lib/wellnessAnalytics').PeriodComparison | null = null;
      const rangeDays = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86400000);
      const prevStart = subDays(rangeStart, rangeDays + 1);
      const prevEnd = subDays(rangeStart, 1);
      let prevMoodQ = supabase.from('mood_entries').select('mood_score, mood_level, entry_date, employee_id')
        .gte('entry_date', format(prevStart, 'yyyy-MM-dd')).lte('entry_date', format(prevEnd, 'yyyy-MM-dd')).limit(10000);
      if (filteredIds) prevMoodQ = prevMoodQ.in('employee_id', filteredIds);
      const { data: prevEntries } = await prevMoodQ;
      if (prevEntries && prevEntries.length > 0) {
        const prevAvg = prevEntries.reduce((s, e) => s + e.mood_score, 0) / prevEntries.length;
        const prevUnique = new Set(prevEntries.map(e => e.employee_id)).size;
        const prevPart = totalActive > 0 ? Math.round((prevUnique / totalActive) * 100) : 0;
        const prevRisk = Math.round((prevEntries.filter(e => e.mood_score <= 2).length / prevEntries.length) * 100);
        periodComparison = computePeriodComparison(
          { avgMood: avgMoodScore, participation: participationRate, risk: riskPercentage },
          { avgMood: Math.round(prevAvg * 10) / 10, participation: prevPart, risk: prevRisk },
        );
      }

      // ── Check-in deep analysis ──
      const checkinMoodOverTime = computeCheckinMoodOverTime(entries, allDays);
      const supportActionCounts = computeSupportActions(entries);
      const streakDistribution = computeStreakDistribution(employeeEntryMap);
      const checkinByOrgUnit = computeCheckinByOrgUnit(orgComparison);

      // ── Three-Layer Intelligence ──
      const checkinPulse = computeCheckinPulse(entries);
      const surveyStructural = computeSurveyStructural(categoryScores, categoryRiskScores, surveyResponseRate);

      const mapUnit = (units: typeof orgComparison.departments) => units.map(d => ({
        id: d.id, name: d.name, nameAr: d.nameAr,
        checkinAvg: d.avgScore, surveyAvg: surveyStructural.categoryHealthScore,
        employeeCount: d.employeeCount,
      }));

      const totalCatResponses = categoryScores.reduce((s, c) => s + c.responseCount, 0);
      const synthesisData = computeSynthesis(
        checkinPulse, surveyStructural,
        avgMoodScore, participationRate, surveyResponseRate,
        entries.length, totalCatResponses,
        {
          branches: mapUnit(orgComparison.branches),
          divisions: mapUnit(orgComparison.divisions),
          departments: mapUnit(orgComparison.departments),
          sections: mapUnit(orgComparison.sections),
        },
      );

      const trendOverlayData: TrendOverlayPoint[] = allDays.map(day => {
        const ds = format(day, 'yyyy-MM-dd');
        const moodEntry = dailyMap[ds];
        return {
          date: ds,
          checkinAvg: moodEntry ? Math.round((moodEntry.total / moodEntry.count) * 10) / 10 : 0,
          surveyAvg: surveyStructural.categoryHealthScore > 0 && (responseDailyMap[ds] ?? 0) > 0
            ? surveyStructural.categoryHealthScore : 0,
        };
      });

      return {
        activeEmployees: totalActive, avgMoodScore, participationRate, surveyResponseRate,
        riskPercentage, avgStreak, moodTrend, moodDistribution, categoryScores,
        subcategoryScores, affectiveDistribution, dayOfWeekActivity,
        riskTrend, orgComparison, topEngagers,
        categoryRiskScores, categoryTrends, categoryMoodMatrix,
        earlyWarnings, periodComparison, compositeHealthScore, moodByCategoryData,
        checkinMoodOverTime, supportActionCounts, streakDistribution, checkinByOrgUnit,
        checkinPulse, surveyStructural, synthesisData, trendOverlayData,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return { data, isLoading };
}
